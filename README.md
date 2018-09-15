# Readme for SILO console and script

This repository contains the code for the Angular-based console for
the SILO application, as well as the Python script which runs on host
machines to read meters.

SILO is an application with an HTTP API, Web-based console, and script
which reads meters. The script reads meters and transponders via serial
interface over IP or modem connections. The script then uploads the
readings to the HTTP API where they can be viewed and managed on the
Web-based console.

SILO consists of building objects, which represent a given address. Each
building can have multiple connection objects, IP or modem, which each can
have multiple meter objects and transponder objects that are directly
accessible. Indirectly accessible meters are connected to transponders. User
objects store the Email Address and password which allows users to sign in
to the console; the same user object can also have an API key and secret
which allows the script running on a host to connect to the API. A query
object stores details of an attempt to read meters and transponders,
including which connection to use, its status and log, and any errors that
are encountered.


## SILO console

Built on Angular, the console consists of JavaScript "controllers" and
HTML "views" which allow users to manage buildings, connections, meters,
transponders, and users.

It is built using AngularJS, JavaScript, CSS and HTML


## SILO script

Written in Python, the script runs on Windows hosts; Windows is necessary
because the script requires a Windows executable (flash.exe) to convert
a binary file of meter readings to a readable text file (BIN to MDT).

The script, once started, will run indefinitely waiting twenty seconds
between intervals, at which it requests a "query" from the HTTP API with
details of a given connection to a building with meters to read.

A log file is created for each query and the details of the attempt to read
the associated meters. Certain log messages will also be sent to the API
to be stored with the query.
