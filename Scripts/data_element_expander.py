#! /usr/bin/env python
import sys
import re

with open('data_elements.csv', 'r') as csvfile:
    headers = next(csvfile)
    csv_content = csvfile.read()

    out_filename = 'data_elements_expanded.csv'
    outfile = open(out_filename, 'w')
    outfile.write(headers)

    lmis_labels = ['Opening balance', 'Quantity Received', 'ART & PMTCT Consumption', 'Losses / Adjustments', 'Days out of stock', 'Adjusted AMC', 'Closing Balance', 'Months of stock on-hand', 'Quantity Required']
    lmis_labels_short = ['OB', 'QRec', 'APC', 'LA', 'DOFS', 'AMC', 'CB', 'MOSO', 'QReq']
    for i in range(len(lmis_labels)):
        altered_csv_content = re.sub(r'(ARV[^"]*)', r'\1_' + lmis_labels_short[i], csv_content)
        altered_csv_content = re.sub(r'(?<=\")([^"]*)(?=",TRACKER)', r'\1__' + lmis_labels[i], altered_csv_content)
        outfile.write(altered_csv_content)

    outfile.close()

    print('wrote to file ', out_filename)
