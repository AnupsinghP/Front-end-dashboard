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
import socket
import subprocess
import sys
import time

__author__ = 'Joshua Shane Martin'
__copyright__ = ['2018 Quadlogic Controls Corporation']
__version__ = '0.0.1'
__status__ = 'Production'

class Importer(object):
    def __init__(self, apiKey, apiSecret, apiServer, path):
        self.apiKey = 'key'
        self.apiSecret = 'secret'
        self.apiServer = 'https://silowebproduction.azurewebsites.net'
        self.path = r'C:\Users\joshuasmartin\Downloads\phone-BLD-1.csv'

        # Configure logging
        self.logger = logging.getLogger()
        formatter = logging.Formatter(
                '%(asctime)s %(name)-12s %(levelname)-8s %(message)s')
        file_handler = logging.FileHandler(r'C:\Users\joshuasmartin\importer.log')
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        stream_handler = logging.StreamHandler()
        stream_handler.setFormatter(formatter)
        self.logger.addHandler(stream_handler)
        self.logger.setLevel(logging.INFO)

        return
        
    def readCsv(self):
        try:
            with open(self.path, newline = '') as csvfile:
                reader = csv.reader(csvfile, delimiter = ',', skipinitialspace = True)
                count = 0
                for row in reader:
                    if len(row) > 0:
                        address = row[0].lstrip().rstrip()
                        destination = row[1].lstrip().rstrip()
                        serials = row[2].lstrip().rstrip().split('-')

                        sts = 0
                        if len(serials) == 0:
                            self.logger.info('Will not import: {}, {}'.format(address, destination))
                            continue
                        for s in serials:
                            if (len(s) <= 4):
                                self.logger.info('Will not import: {}, {}, {}'.format(address, destination, s))
                                sts = sts + 1
                        
                        if sts == 0:
                            # Create the building
                            building = self.createBuilding(address)
                            self.logger.info('Created building {}'.format(building['Id']))

                            # Create the connection
                            if ':' in destination:
                                # IP
                                ip = destination.split(':')
                                connection = self.createIpConnection(building['Id'], ip[0], ip[1])
                                self.logger.info('Created IP connection {}'.format(connection['Id']))
                            else:
                                # Modem
                                number = destination
                                connection = self.createModemConnection(building['Id'], number)
                                self.logger.info('Created modem connection {}'.format(connection['Id']))

                            # Create the transponders
                            for s in serials:
                                transponder = self.createTransponder(connection['Id'], s)
                                self.logger.info('Created transponder {}'.format(transponder['Id']))

                        count = count + 1
            return True
        except:
            return False

    def createBuilding(self, address):
        try:
            params = { 'ApiKey' : self.apiKey, 'ApiSecret' : self.apiSecret }
            data = { 'Address' : address, 'City' : 'New York City', 'State' : 'NY', 'PostalCode' : '00000' }
            result = requests.post(self.apiServer + "/odata/Buildings", json = data, params = params)
            if result.status_code != 201:
                raise ConnectionError(result.text)
            return json.loads(result.content)
        except requests.exceptions.RequestException as e:
            self.logger.error(e)

    def createIpConnection(self, building_id, ip, port):
        try:
            params = { 'ApiKey' : self.apiKey, 'ApiSecret' : self.apiSecret }
            data = { 'Method' : 'IP', 'IpAddress' : ip, 'IpPort' : port, 'BuildingId' : building_id }
            result = requests.post(self.apiServer + "/odata/Connections", json = data, params = params)
            if result.status_code != 201:
                raise ConnectionError(result.text)
            return json.loads(result.content)
        except requests.exceptions.RequestException as e:
            self.logger.error(e)
    
    def createModemConnection(self, building_id, number):
        try:
            params = { 'ApiKey' : self.apiKey, 'ApiSecret' : self.apiSecret }
            data = { 'Method' : 'Modem', 'ModemNumber' : number, 'ModemBaudRate' : '9600', 'ModemDataBits' : '8', 'ModemParity' : 'None', 'ModemStopBit' : '1', 'BuildingId' : building_id }
            result = requests.post(self.apiServer + "/odata/Connections", json = data, params = params)
            if result.status_code != 201:
                raise ConnectionError(result.text)
            return json.loads(result.content)
        except requests.exceptions.RequestException as e:
            self.logger.error(e)
    
    def createTransponder(self, connection_id, serial):
        try:
            params = { 'ApiKey' : self.apiKey, 'ApiSecret' : self.apiSecret }
            data = { 'SerialNumber' : serial, 'ConnectionId' : connection_id }
            result = requests.post(self.apiServer + "/odata/Transponders", json = data, params = params)
            if result.status_code != 201:
                raise ConnectionError(result.text)
            return json.loads(result.content)
        except requests.exceptions.RequestException as e:
            self.logger.error(e)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Import buildings from CSV file.')
    parser.add_argument('--apiKey', type = str,
                    help = 'API key to connect to the server',
                    required = False)
    parser.add_argument('--apiSecret', type = str,
                    help = 'API secret to connect to the server',
                    required = False)
    parser.add_argument('--apiServer', type = str,
                    help = 'URL of the API server',
                    required = False)
    parser.add_argument('--path', type = str,
                    help = 'Path to the CSV file of buildings to import',
                    required = False)
    args = parser.parse_args()
    importer = Importer(args.apiKey, args.apiSecret, args.apiServer, args.path)
    importer.readCsv()