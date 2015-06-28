# Netball-Visualisation
Group project for SWEN303 User Interface Design.
By Will and Hamish

##########################
# To add more data files #
##########################

In parser.js there is a dataFiles variable.

self.dataFiles = [ "data/2008-Table1.csv",
				   "data/2009-Table1.csv",
				   "data/2010-Table1.csv",
				   "data/2011-Table1.csv",
				   "data/2012-Table1.csv",
				   "data/2013-Table1.csv" ];

To add more datafiles, simply add the file to the data folder
then add the string "data/****-Table1.csv" to the dataFiles
array. Where **** is the year of the data.

The year selection buttons on the page are dynamically loaded
at the end of the 'onReady' function in gui.js

Other notes:
Click on the season radio buttons to change the current seasons

The rivals visualisation can be expanded by clicking on one of the nodes.

Hover over things to see more info
