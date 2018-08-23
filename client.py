#!/usr/bin/env python

"""
[TODO]
"""

import argparse
import atexit
import csv
import datetime
import errno
import json
import logging
import os
import re
import requests # pip install requests
import serial # pip install pyserial
import socket
import subprocess
import sys
import time
from xmodem import XMODEM # pip install xmodem

__author__ = 'Joshua Shane Martin'
__copyright__ = ['2018 Quadlogic Controls Corporation']
__version__ = '0.0.1'
__status__ = 'Production'

class Client(object):
    def __init__(self, apiKey, apiSecret, apiServer, pathToConversionExe, pathToReadingsDirectory, serialPort, connectionMethod):
        self.apiKey = apiKey
        self.apiSecret = apiSecret
        self.apiServer = apiServer
        self.instanceId = str(os.getpid())
        self.pathToConversionExe = pathToConversionExe
        self.pathToReadingsDirectory = pathToReadingsDirectory
        self.serialPort = serialPort
        self.connectionMethod = connectionMethod

        # Set defaults
        self.events = []
        self.today = time.strftime("%Y-%m-%d")
        
        # Regular expression for Quadlogic devices
        self.pattern = re.compile("(S|P|M|E|CIP)[:#>]")

        # Passwords for Quadlogic devices
        self.passwords = [
            r'5lEvElbAl',
            r'3Super3',
            r'4E9Kgxk20',
            r'5op\%\%&$6',
            r'4OP!3c@t4',
            r'4u5574',
            r'3helix3',
            r'74321fdsa']

        # Configure logging
        self.logger = logging.getLogger()
        formatter = logging.Formatter(
                '%(asctime)s %(name)-12s %(levelname)-8s %(message)s')
        file_handler = logging.FileHandler('client-{}.log'.format(self.instanceId))
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        stream_handler = logging.StreamHandler()
        stream_handler.setFormatter(formatter)
        self.logger.addHandler(stream_handler)
        self.logger.setLevel(logging.INFO)

        return

    def convertBinToMdt(self, path):
        """
        Runs the BIN to MDT converter executable for the file at given path.
        
        Parameters
        ----------
        path : string
            Path of the BIN file to convert to MDT
        """

        self.updateQuery("Converting", "Converting the BIN file to MDT format: {}".format(path), True)
        log_path = "{}\\{}\\{}-{}-flash.log".format(self.pathToReadingsDirectory, self.today, self.query['Id'], self.device['Id'])
        log = open(log_path, "w+") # Suppress output to stdout from the subprocess
        args = [self.pathToConversionExe, "mdt", path]
        self.updateQuery("Converting", "Calling {}".format(args), True)
        try:
            subprocess.run(args, stdout = log, stderr = log, check = True)
            return True
        except subprocess.CalledProcessError as e:
            self.logger.error(e)
            return False
        except FileNotFoundError as e:
            self.updateQuery("Converting", e, True, 'error')
            return False
        except:
            e = sys.exc_info()[0]
            self.updateQuery("Converting", e, True, 'error')
            return False

    def convertMdtToJson(self, path):
        """
        Reads the MDT file at the given path and builds JSON
        data of meter readings which can be uploaded to the API.
        
        Parameters
        ----------
        path : string
            Path of the MDT file to convert to JSON
        """

        self.updateQuery("Converting", "Converting the MDT file to JSON: {}".format(path), True)
        try:
            device_type = 'Transponder' if 'Slots' in self.device else 'Meter'
            with open(path, newline = '') as mdtfile:
                reader = csv.reader(mdtfile, delimiter = ' ', skipinitialspace = True)
                for row in reader:
                    if len(row) > 0:
                        read_at = self.xldate_to_datetime(float(row[6]))
                        event = { 'SerialNumber' : row[0], 'ReadAt' : read_at.strftime("%Y-%m-%d"), 'QueryId' : self.query['Id'], 'Channel' : row[2] }
                        
                        # Rows can be different measurements
                        if row[4].lower() == 'kwh':
                            event['kWh'] = row[5]
                        elif row[4].lower() == 'kw':
                            event['kW'] = row[5]
                        
                        # API must know if meter belongs to transponder
                        if device_type == 'Transponder':
                            event['TransponderId'] = self.device['Id']
                        self.events.append(event)
            return True
        except:
            return False

    def datetime_to_xldate(self, date1):
        temp = datetime.datetime(1899, 12, 30)    # Note, not 31st Dec but 30th!
        delta = date1 - temp
        return float(delta.days) + (float(delta.seconds) / 86400)
    
    def exitHandler(self):
        self.logger.info("Cleaning up...")
        self.serial.close()
    
    def getDevices(self):
        """
        Returns the list of directly connected meters and transponders
        belonging to the connection for the current query.
        """

        self.updateQuery('Preparing', 'Getting transponders and meters to read', True)
        params = { 'ApiKey' : self.apiKey, 'ApiSecret' : self.apiSecret }

        m_url = (self.apiServer + "/odata/Meters?$filter=ConnectionId eq {} and TransponderId eq null".format(self.query['ConnectionId']))
        m_result = requests.get(m_url, params = params)
        if m_result.status_code != 200:
            self.updateQuery('Preparing', 'Could not get meters to read', True, 'error')
            meters = []
        else:
            meters = json.loads(m_result.content)['value']

        t_url = (self.apiServer + "/odata/Transponders?$filter=ConnectionId eq {}".format(self.query['ConnectionId']))
        t_result = requests.get(t_url, params = params)
        if t_result.status_code != 200:
            self.updateQuery('Preparing', 'Could not get transponders to read', True, 'error')
            transponders = []
        else:
            transponders = json.loads(t_result.content)['value']
        
        return meters + transponders

    def openConnection(self):
        """
        """

        # Get all the meters and transponders to read
        devices = self.getDevices()
        self.events = [] # Must clear the events from previous readings
        self.today = time.strftime("%Y-%m-%d") # Will serve as the directory location

        retries_o = 3
        attempt_o = 1
        success_o = False
        while (attempt_o <= retries_o) and not success_o:
            try:
                # IP and modem connections have different URLs
                if self.query['Connection']['Method'] == 'IP':
                    self.updateQuery('Opening Connection', 'Opening IP connection to {}:{}, attempt {} of {}'.format(self.query['Connection']['IpAddress'], self.query['Connection']['IpPort'], attempt_o, retries_o), True)
                    url = 'socket://{}:{}'.format(self.query['Connection']['IpAddress'], self.query['Connection']['IpPort'])
                    self.serial = serial.serial_for_url(url, do_not_open = True)
                    self.logger.info('Setting ModemBaudRate to 9600')
                    self.serial.baudrate = 9600
                elif self.query['Connection']['Method'] == 'Modem':
                    self.updateQuery('Opening Connection', 'Opening modem connection to {}, attempt {} of {}'.format(self.query['Connection']['ModemNumber'], attempt_o, retries_o), True)
                    # Sometimes we connect to the modem over IP instead
                    # of COM port or device, so the URL is different
                    if ":" in self.serialPort:
                        url = "socket://{}".format(self.serialPort)
                    else:
                        url = self.serialPort
                    self.serial = serial.serial_for_url(url, do_not_open = True)
                    self.logger.info('Setting ModemBaudRate to {}'.format(self.query['Connection']['ModemBaudRate']))
                    self.serial.baudrate = int(self.query['Connection']['ModemBaudRate'])

                # Default timeout is the same for any connection method
                # Note that this can be overridden later
                self.serial.timeout = 2

                # Open the serial port if it is not already
                if not self.serial.isOpen():
                    self.updateQuery('Opening Connection', 'Opening connection, because it is not open yet', True)
                    self.serial.open()
                    
                success_o = True
                self.updateQuery('Opened Connection', 'Connection is ready', True)
            except ValueError as e:
                self.updateQuery('Opening Connection', 'Failed to open connection: {}'.format(e), True, 'warn')
                time.sleep(10)
            except serial.SerialException as e:
                self.updateQuery('Opening Connection', 'Failed to open connection: {}'.format(e), True, 'warn')
                time.sleep(10)

            # Try again
            attempt_o = attempt_o + 1

        # Could not open connection
        if not success_o and attempt_o == 4:
            msg = 'Cannot Open Connection'
            self.updateQuery('Cannot Open Connection', msg, True, 'warn', error = msg)
            return

        # Modem connections require some additional interaction
        if self.query['Connection']['Method'] == 'Modem':
            # Set data bits for this connection
            if self.query['Connection']['ModemDataBits'] == '8':
                self.logger.info('Setting ModemDataBits to EIGHTBITS')
                self.serial.bytesize = serial.EIGHTBITS
            elif self.query['Connection']['ModemDataBits'] == '7':
                self.logger.info('Setting ModemDataBits to SEVENBITS')
                self.serial.bytesize = serial.SEVENBITS
            
            # Set parity for connection
            if self.query['Connection']['ModemParity'] == 'None':
                self.logger.info('Setting ModemParity to PARITY_NONE')
                self.serial.parity = serial.PARITY_NONE
            elif self.query['Connection']['ModemParity'] == 'Odd':
                self.logger.info('Setting ModemParity to PARITY_ODD')
                self.serial.parity = serial.PARITY_ODD
            elif self.query['Connection']['ModemParity'] == 'Even':
                self.logger.info('Setting ModemParity to PARITY_EVEN')
                self.serial.parity = serial.PARITY_EVEN
            elif self.query['Connection']['ModemParity'] == 'Mark':
                self.logger.info('Setting ModemParity to PARITY_MARK')
                self.serial.parity = serial.PARITY_MARK
            elif self.query['Connection']['ModemParity'] == 'Space':
                self.logger.info('Setting ModemParity to PARITY_SPACE')
                self.serial.parity = serial.PARITY_SPACE

            # Set stop bits for connection
            if self.query['Connection']['ModemStopBit'] == '1':
                self.logger.info('Setting ModemStopBit to STOPBITS_ONE')
                self.serial.stopbits = serial.STOPBITS_ONE
            elif self.query['Connection']['ModemStopBit'] == '2':
                self.logger.info('Setting ModemStopBit to STOPBITS_TWO')
                self.serial.stopbits = serial.STOPBITS_TWO
            
            # Check if the modem is ready for dialing
            retries_c = 3
            attempt_c = 1
            success_c = False
            while (attempt_c <= retries_c) and not success_c:
                self.updateQuery('Preparing to Dial', 'Checking if modem is ready, attempt {} of {}'.format(attempt_c, retries_c), True)
                if 'OK' in self.sendln('ATZ', 1):
                    self.updateQuery('Preparing to Dial', 'Modem is ready', True)
                    time.sleep(0.5) # Wait for modem
                    success_c = True
                
                # Try again
                attempt_c = attempt_c + 1

            # Modem was not ready
            if not success_c and attempt_c == 4:
                msg = 'Modem is not ready'
                self.updateQuery('Modem Not Ready', msg, True, 'warn', error = msg)
                return
            
            # Dial the number
            retries_d = 3
            attempt_d = 1
            success_d = False
            while (attempt_d <= retries_d) and not success_d:
                def dial():
                    self.updateQuery('Dialing', 'Dialing the number {}, attempt {} of {}'.format(self.query['Connection']['ModemNumber'], attempt_d, retries_d), True)
                    return self.sendln("ATDT,,{}".format(self.query['Connection']['ModemNumber']), 20)

                result = dial()

                if 'BUSY' in result:
                    self.updateQuery('Dialing', 'Received BUSY, trying again', True)
                    time.sleep(3) # Wait before trying again
                elif 'NO CARRIER' in result:
                    self.updateQuery('Dialing', 'Received NO CARRIER, trying again', True)
                    time.sleep(3) # Wait before trying again
                elif 'CONNECT' in result:
                    self.updateQuery('Dialed', 'Dialed into {}'.format(self.query['Connection']['ModemNumber']), True)
                    success_d = True
                    time.sleep(0.5)
                else:
                    msg = 'Could not dial the number, trying again'
                    self.updateQuery('Dialing', msg, True, 'warn', error = msg)
                    time.sleep(3) # Wait before trying again
                
                # Try again
                attempt_d = attempt_d + 1

            # Could not dial the number
            if not success_d and attempt_d == 4:
                self.updateQuery('Could Not Dial', 'Could not dial the number', True, 'warn')
                return
        
        # Is the connection working?
        self.updateQuery('Preparing to Transfer', 'Checking if the connection to device is stable', True)
        self.sendln('attn')
        time.sleep(0.5)
        
        # Check again to be sure
        self.updateQuery('Preparing to Transfer', 'Checking again if the connection to device is stable', True)
        self.sendln('attn')
        time.sleep(0.5)

        # Loop each transponder and each meter without a transponder
        # to connect with each one and retrieve the readings
        for d in devices:
            self.device = d
            retries_p = 3
            attempt_p = 1
            authenticated_p = False
            while attempt_p <= retries_p and not authenticated_p:
                device_type = 'Transponder' if 'Slots' in d else 'Meter'

                # Attempt each password for this device until one works
                self.updateQuery('Authenticating', 'Attempting to authenticate {} {}, attempt {} of {}'.format(device_type, d['SerialNumber'], attempt_p, retries_p), True)

                # We know the password for some devices, for others we have
                # to loop each possible password to see which one works
                if d['Password']:
                    cmd = "attn -S {} -{}".format(d['SerialNumber'], d['Password'])
                    if re.search(self.pattern, self.sendln(cmd, 20, False)) is not None:
                        authenticated_p = True
                        self.updateQuery('Authenticated', 'Successfully authenticated {} {}'.format(device_type, d['SerialNumber']), True)
                        
                        # We're authenticated, so download the binary of readings
                        self.initiateRetrieveBinary(d)
                else:
                    for p in self.passwords:
                        if authenticated_p: continue

                        cmd = "attn -S {} -{}".format(d['SerialNumber'], p)
                        if re.search(self.pattern, self.sendln(cmd, 20, False)) is not None:
                            # The password matched, we can continue
                            authenticated_p = True
                            self.updateQuery('Authenticated', 'Successfully authenticated {} {}'.format(device_type, d['SerialNumber']), True)
                            
                            # We're authenticated, so download the binary of readings
                            self.initiateRetrieveBinary(d)
                
                # Try again
                attempt_p = attempt_p + 1

            # None of the passwords worked,
            # or if the device did not return a valid prompt
            if not authenticated_p and attempt_p == 4:
                msg = 'Could not authenticate {} {}'.format(device_type, d['SerialNumber'])
                self.updateQuery('Authenticating', msg, True, 'warn', error = msg)

        # Disconnect from the connection gracefully
        self.updateQuery("Disconnecting", "Disconnecting and cleaning up resources", True)
        self.serial.close()
        
        if self.events:
            # Upload the readings
            if not self.uploadReadings():
                msg = "Could not upload readings to API"
                self.updateQuery("Uploading", msg, True, 'warn', error = msg)
        else:
            msg = "No readings to upload"
            self.updateQuery("No Readings", msg, True, 'warn', error = msg)

    def initiateRetrieveBinary(self, device):
        device_type = 'Transponder' if 'Slots' in device else 'Meter'

        # Functions for the XMODEM utility
        def getc(size, timeout = 3):
            # return self.serial.read(size) or None
            self.serial.timeout = timeout
            self.serial.inter_byte_timeout = None
            r = self.serial.read(size)
            if len(r) != size:
                return (None)
            else:
                return (r)

        def putc(data, timeout = 3):
            return self.serial.write(data) # Note that this ignores the timeout

        # Download the binary file with meter readings
        self.updateQuery("Requesting Events", "Sending event command with range {} to {} {}".format(self.query['Range'], device_type, device['SerialNumber']), True)
        self.sendln("event -XIgD -> {}".format(self.query['Range']), 20) # "05/16/2018"

        # Wait for the device to be ready again
        time.sleep(60)

        self.updateQuery("Receiving Events", "Attempting to receive events in binary", True)
        transferred = False
        try:
            modem = XMODEM(getc, putc)
            bin_path = "{}\\{}\\{}-{}.bin".format(self.pathToReadingsDirectory, self.today, self.query['Id'], device['Id'])
            mdt_path = "{}\\{}\\{}-{}.bin.mdt".format(self.pathToReadingsDirectory, self.today, self.query['Id'], device['Id'])

            # Create the directory paths if they don't exist
            try:
                os.makedirs(os.path.dirname(bin_path))
                os.makedirs(os.path.dirname(mdt_path))
            except OSError as exc: # Guard against race condition
                if exc.errno != errno.EEXIST:
                    raise
            
            stream = open(bin_path, 'wb')
            if modem.recv(stream, retry = 10, timeout = 4, crc_mode = 0) != None:
                stream.flush()
                stream.close()
                self.updateQuery('Receiving Events', 'Received events for {} {}'.format(device_type, device['SerialNumber']), True)
                transferred = True
                # self.sendln('attn')
                # time.sleep(0.5)
                
                # self.sendln('attn')
                # time.sleep(0.5)
            else:
                raise ConnectionError()
        except serial.SerialException as e:
            msg = 'Could not receive events for {} {}: {}'.format(device_type, device['SerialNumber'], e)
            self.updateQuery('Receiving Events', msg, True, 'warn', error = msg)
        except ConnectionError as e:
            msg = 'Could not receive events for {} {}: {}'.format(device_type, device['SerialNumber'], e)
            self.updateQuery('Receiving Events', msg, True, 'warn', error = msg)
        
        if transferred:
            # Convert the BIN file to MDT format
            if not self.convertBinToMdt(bin_path):
                msg = 'Could not convert BIN file to MDT format'
                self.updateQuery('Converting', msg, True, 'warn', error = msg)
                return
            
            # Convert MDT file (which is CSV) to JSON
            if not self.convertMdtToJson(mdt_path):
                msg = 'Could not convert MDT file to JSON'
                self.updateQuery('Converting', msg, True, 'warn', error = msg)
                return

    def initiateQuery(self):
        """
        Returns a new query object from the server with connection details.
        
        Returns
        -------
        dictionary
            Query with connection details
        """
        
        self.logger.info('Initiating a new query')
        params = { 'ApiKey' : self.apiKey, 'ApiSecret' : self.apiSecret }
        url = '{}/odata/Queries/Default.Next?$expand=Connection'.format(self.apiServer)

        try:
            data = { 'Hostname' : socket.gethostname(), 'InstanceId' : self.instanceId }
            if self.connectionMethod:
                data['Method'] = self.connectionMethod
            query = requests.post(url, json = data, params = params)
            if query.status_code != 201:
                raise ConnectionError(query.text)
            else:
                self.logger.info('New query has been initiated')
                return json.loads(query.content)
        except:
            self.logger.warn("Could not initiate a new query, trying again")
            return None

    def main(self):
        """
        Entry point for the SILO client.
        """

        self.logger.info('Using API at ' + self.apiServer)
        self.logger.info('Using API Key: ' + self.apiKey)
        self.logger.info('Using API Secret: ' + self.apiSecret)

        try:
            atexit.register(self.exitHandler)

            self.logger.info("SILO Client is running...")
            while True:
                # Initiates a new query
                self.query = self.initiateQuery()
                # Open the connection for the new query
                if self.query:
                    self.openConnection()

                # Wait for the modem to finish before restarting
                self.logger.info("Waiting...")
                time.sleep(20)
        except KeyboardInterrupt:
            self.logger.info("Exiting...")
    
    def sendln(self, cmd, timeout = 2, print_output = True):
        def rreplace(s, old, new, occurrence):
            li = s.rsplit(old, occurrence)
            return new.join(li)

        try:
            self.serial.flushInput()
            self.serial.flushOutput()

            self.serial.timeout = timeout

            cmd = cmd + '\r'
            self.serial.write(cmd.encode('utf-8'))

            r_buf_maxlen = 2000
            r_buf = b''
            timeout_limit = (time.time() + 2)

            while (time.time() < timeout_limit) and (len(r_buf) < r_buf_maxlen):
                try:
                    self.updateQuery('Reading', 'Reading...', True)
                    rd_char = self.serial.read(r_buf_maxlen - len(r_buf))
                except:
                    self.updateQuery('Reading', 'Could not read...', True, 'warn')
                    rd_char = b''

                hold_char = b''
                for i in range(len(rd_char)):
                    try:
                        test_char = rd_char[i:i+1]
                        test_char.decode('utf-8')
                    except UnicodeError:
                        self.updateQuery('Reading', 'Invalid character in reply: {}'.format(test_char), True, 'warn')
                        test_char = b''
                    hold_char += test_char
                rd_char = hold_char

                if len(rd_char) > 0:
                    # Got some characters - reset timeout, add to buffer, and see if prompt
                    timeout_limit = (time.time() + 3)
                    r_buf += rd_char

            # Remove newlines and the command we sent
            r_buf = r_buf.decode('utf-8')
            r_buf = r_buf.replace(cmd + '\r\n', '')
            r_buf = rreplace(r_buf, '\r\n', '', 1)
            if print_output:
                self.updateQuery('Reading', r_buf, True)
            return r_buf
        except serial.SerialException as e:
            self.updateQuery('Reading', e, True, 'warn')
            return ''
    
    def updateQuery(self, status, log, print_to_file, level = 'info', error = ''):
        """
        Updates the query on the server with the given status and log entry.
        """

        # Log the message to the log file
        if print_to_file:
            if level == 'info':
                self.logger.info('Q{} - {}'.format(self.query['Id'], log))
            elif level == 'error':
                self.logger.error('Q{} - {}'.format(self.query['Id'], log))
            elif level == 'warn':
                self.logger.warn('Q{} - {}'.format(self.query['Id'], log))
            else:
                self.logger.info('Q{} - {}'.format(self.query['Id'], log))

        # Attempt to send the log message to the API
        retries = 3
        attempt = 1
        success = False
        while (attempt <= retries) and not success:
            params = { 'ApiKey' : self.apiKey, 'ApiSecret' : self.apiSecret }
            data = { 'Status' : status, 'Log' : "{} {}".format(datetime.datetime.now(), log) }

            # Error messages can also be sent
            if error:
                data['Errors'] = error
            
            if status == 'Done':
                data['IsBusy'] = False
            result = requests.patch(self.apiServer + "/odata/Queries({})".format(self.query['Id']), json = data, params = params)
            if result.status_code == 204:
                success = True
            else:
                self.logger.error('Q{} - Could not send query update to the API'.format(self.query['Id']))
                self.logger.error(result.text) # Should do this in case of connection problem
            
            if not success and attempt == 3:
                return

            # Try again
            attempt = attempt + 1

    def uploadReadings(self):
        """
        Uploads the JSON data to the API.
        """

        self.updateQuery("Uploading", "Uploading the JSON data to the API", True)
        try:
            params = { 'ApiKey' : self.apiKey, 'ApiSecret' : self.apiSecret }
            data = { 'Events' : self.events }
            result = requests.post(self.apiServer + "/odata/Imports/Default.ImportJson", json = data, params = params)
            if result.status_code != 200:
                raise ConnectionError(result.text)
            self.updateQuery("Done", "Done", True)
            return True
        except requests.exceptions.RequestException as e:
            self.logger.error(e)
            return False

    def xldate_to_datetime(self, xldate):
        #temp = datetime.datetime(1900, 1, 1) # this line may be removed in the future
        temp = datetime.datetime(1899, 12, 30)    # Note, not 31st Dec but 30th!
        delta = datetime.timedelta(days = xldate)
        return temp + delta

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Read from meters.')
    parser.add_argument('--apiKey', type = str,
                    help = 'API key to connect to the server',
                    required = True)
    parser.add_argument('--apiSecret', type = str,
                    help = 'API secret to connect to the server',
                    required = True)
    parser.add_argument('--apiServer', type = str,
                    help = 'URL of the API server',
                    required = True)
    parser.add_argument('--pathToConversionExe', type = str,
                    help = 'Path to the conversion executables (flash6.exe)',
                    required = True)
    parser.add_argument('--pathToReadingsDirectory', type = str,
                    help = 'Path to the staging directory for meter readings',
                    required = True)
    parser.add_argument('--serialPort', type = str,
                    help = 'COM port or Unix device to use for modem connections',
                    required = True)
    parser.add_argument('--connectionMethod', type = str,
                    help = 'Only allow queries to IP or Modem connections',
                    required = False)
    args = parser.parse_args()
    client = Client(args.apiKey, args.apiSecret, args.apiServer, args.pathToConversionExe, args.pathToReadingsDirectory, args.serialPort, args.connectionMethod)
    # client = Client('key', 'secret', 'https://silowebproduction.azurewebsites.net', r"C:\QLC\flash6.exe", r"C:\QLC\Family5\readings", '10.1.120.61:10002', 'IP')
    client.main()