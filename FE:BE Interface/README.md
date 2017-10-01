# The interface

This folder contains the interface between Frontend (data entry application) and Backend (DHIS2 server calls) created to connect the Frontend and backend. This interface is produced to be included as a part of this DHIS2 webapp: https://github.com/lmisuganda/entryAndApproval.

## Interface functions

setFacility(id): Initializes the facility object to be equal to all orders available

setLightWeightFacility(id): Initializes the facility object with only the metadata of the orders

setForm(orgunit_id, id): Initializes the form object through a given id and orgunit

updateFormOnServer(orgUnitId, form): Pushes the modified form back to the server

updateSectionOnServer(orgUnitId, eventID, section): Pushes the modified section back to the server

updateCommodityOnServer(orgUnitId, eventID, commodity): Pushes the modified commodity back to the server

updateEventWithBlanks(orgunit_id, event_id): Reset the event

createBlankEvent(program_id, program_stage_id, orgunit_id, posting_date): Create a new blank event

setFacilities(): Initializes an array of all facilities and their corresponding facility objects
