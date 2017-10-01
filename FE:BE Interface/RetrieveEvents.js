var base_url = 'https://lmis-dev.dhis2.org/dhis'
// var base_url = '..'


/*
    UTILS
*/


function getCorrectName(name){
    only_commodity_name = removeCommodityOperationPostfix(name)
    return only_commodity_name;
}

function removeProgramName(name){
    var NUMBER_OF_SPACES = 1;
    return name.substring((program_name.length + NUMBER_OF_SPACES))
}

function getFullName(short_name){
    return data_element_short_name_and_name[short_name];
}

function getCommodityOperationPostfix(name){
    return name.split('__')[1]
}

function getMetadataPostfix(name){
    return name.split('__')[2]
}

function removeCommodityOperationPostfix(name){
    return name.split('__')[0]
}


/*
    GET EVENTS
*/

var program_id = 'Y3mw3alAgKH'
var program_stage_id = 'MFlEmsId1Hy'
var program_name = 'ARV'
var org_unit_zone = ''
var order_periods = {}
var all_api_events = [];
var all_api_sections = [[]]
var DATA_ELEMENT_VALUES_START = 8

var commodities = [[]]
var sections = [[]]
var forms = []
var cycles = []
var one_form = []
var all_facilities_information = []


function getDateStringFromTwoMonthsEarlierThan(non_valid_date) {
    function getCorrectMonthOrDay(month_or_day){
        return (parseInt(month_or_day) < 10) ? '0' + month_or_day : month_or_day
    }

    function getCorrectDateString(full_date){
        return full_date.getFullYear() + '-' + getCorrectMonthOrDay(full_date.getMonth() + 1) + '-' + getCorrectMonthOrDay(full_date.getDate())
    }
    var NUMBER_OF_MONTHS = 2
    var valid_date = new Date(non_valid_date)
    valid_date.setMonth(valid_date.getMonth() - NUMBER_OF_MONTHS);
    return getCorrectDateString(valid_date)
}

function getEvent(program_id, orgunit_id, cycle_start, cycle_end){
    var data_element_ids = getAllDataElementIDs()
    var data_elements_string = ''
    var all_data = {}
    for(var i = 0; i < Math.ceil(data_element_ids.length/2); i++){
        data_elements_string +=  'dimension=' + data_element_ids[i] + '&'
    }

    $.ajax({
        url: base_url + '/api/analytics/events/query/' + program_id + '?dimension=ou:' + orgunit_id + '&' + data_elements_string + 'startDate=' + cycle_start + '&endDate=' + cycle_end + '&_' + new Date().getTime(),
        type: 'GET',
        async: false,
        error: function (data) {
            console.log("Error on retrieving data via API call")
        },
        success: function (json_first_half) {
            all_data = json_first_half
        }
    })

    var data_elements_string = ''
    for(var i = (Math.floor(data_element_ids.length/2) + 1); i < data_element_ids.length; i++){
        data_elements_string +=  'dimension=' + data_element_ids[i] + '&'
    }

    return $.get( base_url + '/api/analytics/events/query/' + program_id + '?dimension=ou:' + orgunit_id + '&' + data_elements_string + 'startDate=' + cycle_start + '&endDate=' + cycle_end + '&_' + new Date().getTime(), function( json_second_half ) {
        if(all_data.height!=1){
            return;
        }

        for(var i = DATA_ELEMENT_VALUES_START; i < json_second_half.headers.length; i++){
            all_data.headers.push(json_second_half.headers[i])
        }
        for(var i = DATA_ELEMENT_VALUES_START; i < json_second_half.rows[0].length; i++){
            all_data.rows[0].push(json_second_half.rows[0][i])
        }
        all_api_events.push(all_data)
    });



}

function getEventByLeastInfo(program_id, orgunit_id, cycle_start, cycle_end){
    return $.get( base_url + '/api/analytics/events/query/' + program_id + '?dimension=ou:' + orgunit_id + '&startDate=' + cycle_start + '&endDate=' + cycle_end, { async: false }, function( json ) {
        if(json.height!=1){
            return;
        }
        json.program_id = program_id
        json.orgunit_id = orgunit_id
        json.cycle_start = cycle_start
        json.cycle_end = cycle_end
        all_api_events.push(json)
    });
}

function getAllDataElementIDs(){
    data_element_ids = []
    getRelevantData('dataElements', 'filter=shortName:^ilike:' + program_name + '&order=code:asc&', 'id', function(data){
        for(var i = 0; i < data.dataElements.length; i++){
            data_element_ids.push(data.dataElements[i].id)
        }
    })
    return data_element_ids
}


function getRelevantData(kind_of_data, filter, fields, callback){
    return $.ajax({
        url: base_url + '/api/' + kind_of_data + '.jsonp?' + filter + 'paging=false&fields=' + fields,
        type: 'GET',
        async: false,
        dataType: 'jsonp',
        contentType:'application/jsonp',
        error: function (data) {
            console.log("Error on retrieving data via API call")
        },
        success: function (data) {
            callback(data)
        }
    });
}

function setOrderDeadlines(orgunit_id){
    return getRelevantData('organisationUnitGroups', 'filter=organisationUnits.id:eq:' + orgunit_id +'&', 'displayName', function(data){
        console.log("data", data)
        if(data.organisationUnitGroups.length == 0){
            return new Promise(function(resolve, reject){
                reject()
            })
        }
        org_unit_zone = data.organisationUnitGroups[0].displayName
    }).then(function(){
        return getCyclePeriods(org_unit_zone)
    })
}

function getCyclePeriods(org_unit_zone){
    return $.get( base_url + '/api/26/dataStore/ConfigurationLMIS/warehouses', { async: false }, function( json ) {
        order_periods = json[org_unit_zone];
    });
}

function generateFromEventId(event_uid, orgunit_id){
    return setOrderDeadlines(orgunit_id).then(function(){
        console.log("creating json-object for webapp...")
        return generateFromEventById(event_uid, orgunit_id)
    })
}

function generateFromOrderingCycles(program_id, orgunit_id){

    return setOrderDeadlines(orgunit_id).then(function(){
        console.log("creating json-object for webapp...")
        return generateFromEvents(orgunit_id)
    })

}

function generateLightWeightFromOrderingCycles(program_id, orgunit_id){

    return setOrderDeadlines(orgunit_id).then(function(){
        console.log("creating json-object for webapp...")
        return generateLightWeightFromEvents(orgunit_id)
    })

}

var event_promise = []

function setEventfromId(event_uid){
    for(var i = 0; i < all_api_events.length; i++){
        if(all_api_events[i].rows.length > 0 && all_api_events[i].rows[0][0] == event_uid){
            event_promise.push(getEvent(all_api_events[i].program_id, all_api_events[i].orgunit_id, all_api_events[i].cycle_start, all_api_events[i].cycle_end))
            all_api_events = [] // reset
        }
    }
}

function generateFromEventById(event_uid, orgunit_id){
    var promises = [];

    for(var i = 0; i < order_periods.length; i++){
        var cycle_start = '';
        var cycle_end = '';
        if (i==0){
            cycle_start = getDateStringFromTwoMonthsEarlierThan(order_periods[i].deadline);
        } else{
            cycle_start = order_periods[i-1].deadline;
        }

        cycle_end = order_periods[i].deadline;

        promises.push(getEventByLeastInfo(program_id, orgunit_id, cycle_start, cycle_end));
    }

    return $.when.apply($, promises).then(function() {
        setEventfromId(event_uid)
        return event_promise[0].then(function(){
            createCommodityObject(event_uid, 0)
            return setLastUpdatedDate(0).then(function(){
                return setSections('ARV', 0).then(function(){
                    createSectionObject(0)
                    return createFormObject(0).then(function(){
                        createCycleObject(0)
                    })
                })
            })
        })

    }, function() {
        console.log("error in generateFromEventById()")
    });
}

function generateFromEvents(orgunit_id){
    var promises = [];
    for(var i = 0; i < order_periods.length; i++){
        var cycle_start = '';
        var cycle_end = '';
        if (i==0){
            cycle_start = getDateStringFromTwoMonthsEarlierThan(order_periods[i].deadline);
        } else{
            cycle_start = order_periods[i-1].deadline;
        }

        cycle_end = order_periods[i].deadline;

        promises.push(getEvent(program_id, orgunit_id, cycle_start, cycle_end));
    }

    return $.when.apply($, promises).then(function() {
        return waitForFullEvent(promises, 0)
    }, function() {
        console.log("error in generateFromEvents()")
    });
}

function generateLightWeightFromEvents(orgunit_id){
    var promises = [];
    for(var i = 0; i < order_periods.length; i++){
        var cycle_start = '';
        var cycle_end = '';
        if (i==0){
            cycle_start = getDateStringFromTwoMonthsEarlierThan(order_periods[i].deadline);
        } else{
            cycle_start = order_periods[i-1].deadline;
        }

        cycle_end = order_periods[i].deadline;
        promises.push(getEventByLeastInfo(program_id, orgunit_id, cycle_start, cycle_end));
    }

    return $.when.apply($, promises).then(function() {
        return waitForEvent(promises, 0)
    }, function() {
        console.log("error in generateLightWeightFromEvents()")
    });
}

function setLastUpdatedDate(i){
    var event_id = all_api_events[i].rows[0][0]
    var lastUpdated = ''
    return $.ajax({
        url:  base_url + '/api/events.json?event=' + event_id + '&paging=false&fields=lastUpdated',
        type: 'GET',
        async: false,
        error: function (data) {
            console.log("Error on retrieving data via API call")
        },
        success: function (json) {
            all_api_events[i].lastUpdated = json.events[0].lastUpdated
        }
    });
}


function waitForEvent(promises, i){
    if(promises.length == 0){
        return new Promise(function(resolve, reject){
            resolve()
        })
    } else if (all_api_events[i] && all_api_events[i].height > 0){
        return setLastUpdatedDate(i).then(function(){
            return createFormObject(i).then(function(){
                createCycleObject(i)
                return waitForEvent(promises.slice(1, promises.length), i+1)
            })
        })
    } else {
        return waitForEvent(promises.slice(1, promises.length), i+1)
    }
}

function waitForFullEvent(promises, i){
    if(promises.length == 0){
        return new Promise(function(resolve, reject){
            resolve()
        })
    } else if (all_api_events[i] && all_api_events[i].height > 0){
        createCommodityObject(undefined, i)
        return setLastUpdatedDate(i).then(function(){
            return setSections('ARV', i).then(function(){
                createSectionObject(i)
                return createFormObject(i).then(function(){
                    createCycleObject(i)
                    return waitForFullEvent(promises.slice(1, promises.length), i+1)
                })
            })
        })
    } else {
        return waitForFullEvent(promises.slice(1, promises.length), i+1)
    }
}

function setSections(program_name, event_number){
    return $.ajax({
        url:  base_url + '/api/programStageSections.json?filter=programStage.name:eq:' + program_name + '&paging=false&fields=displayName,id,programStageDataElements[dataElement]&order=sortOrder:asc',
        type: 'GET',
        async: false,
        error: function (data) {
            console.log("Error on retrieving data via API call")
        },
        success: function (json) {
            all_api_sections[event_number] = json.programStageSections
            for(var i = 0; i < all_api_sections[event_number].length; i++){

                all_api_sections[event_number][i].notApplicable = notApplicableDict[event_number][all_api_sections[event_number][i].displayName]
                all_api_sections[event_number][i].notApplicable_id = notApplicableDict_ids[event_number][all_api_sections[event_number][i].displayName]
                all_api_sections[event_number][i].completed = completedDict[event_number][all_api_sections[event_number][i].displayName]
                all_api_sections[event_number][i].completed_id = completedDict_ids[event_number][all_api_sections[event_number][i].displayName]
            }
            return
        }
    });
}


/*
    CREATION OF COMMODITY-OBJECTS
*/

function createCyclesObject(program_id, orgunit_id){
    return generateFromOrderingCycles(program_id, orgunit_id)
}

function createLightWeightCyclesObject(program_id, orgunit_id){
    return generateLightWeightFromOrderingCycles(program_id, orgunit_id)
}

function createCyclesObjectFromEventId(event_uid, orgunit_id){
    return generateFromEventId(event_uid, orgunit_id)
}

function getDataElementGroupID(commodity_name){
    return $.get( base_url + '/api/dataElementGroups.json?filter=displayName:eq:' + commodity_name + '&paging=false', { async: false },  function( json ) {
        return
    });
}

function findEventWithData(){
    for(var i = 0; i < all_api_events.length; i++){
        if (all_api_events[i].height > 0){
            return all_api_events[i]
        }
    }
}

var notApplicableDict = [{}]
var notApplicableDict_ids = [{}]
var completedDict = [{}]
var completedDict_ids = [{}]

function fetchEventById(event_uid){
    for(var i = 0; i < all_api_events.length; i++){
        event_id = all_api_events[i].rows[0][0]
        if(event_id == event_uid){
            return all_api_events[i]
        }
    }
}

function createCommodityObject(event_uid, event_number){
    // PICKS ONE OF THE EVENTS
    var event = {};
    if (event_uid){
        event = fetchEventById(event_uid)
    } else {
        event = all_api_events[event_number]
    }

    var current_commodity = ''
    var commodity_counter = -1

    notApplicableDict[event_number] = []
    notApplicableDict_ids[event_number] = []
    completedDict[event_number] = []
    completedDict_ids[event_number] = []
    commodities[event_number] = []

    for(var i = DATA_ELEMENT_VALUES_START; i < event.headers.length; i++){
        var commodity_name = getCorrectName(event.headers[i].column);

        if (commodity_name != current_commodity){
            commodity_counter++
            commodities[event_number][commodity_counter] = []
            current_commodity = commodity_name
            commodities[event_number][commodity_counter] = {};
            commodities[event_number][commodity_counter].basicUnit = 'Pack of 30'
            commodities[event_number][commodity_counter].name = commodity_name
            commodities[event_number][commodity_counter].id = commodity_counter
            commodities[event_number][commodity_counter].dataElements = []
        }
        var dataElementObj = {}
        dataElementObj.name = getCommodityOperationPostfix(event.headers[i].column);
        if (dataElementObj.name == 'applicable'){
            if (parseInt(event.rows[0][i]) == 1){
                commodities[event_number][commodity_counter].notApplicable = false
            } else {
                commodities[event_number][commodity_counter].notApplicable = true
            }
            commodities[event_number][commodity_counter].notApplicable_id = event.headers[i].name
        } else if (dataElementObj.name == 'completed'){
            var section_name = event.headers[i].column.split('__')[0]
            if (parseInt(event.rows[0][i]) == 1){
                commodities[event_number][commodity_counter].completed = true
            } else {
                commodities[event_number][commodity_counter].completed = false
            }
            commodities[event_number][commodity_counter].completed_id = event.headers[i].name
        } else if (dataElementObj.name == 'metadata'){
            var metadata_type = getMetadataPostfix(event.headers[i].column);
            if(metadata_type == 'completed'){
                var section_name = event.headers[i].column.split('__')[0]
                if (parseInt(event.rows[0][i]) == 1){
                    completedDict[event_number][section_name] = true
                } else {
                    completedDict[event_number][section_name] = false
                }
                completedDict_ids[event_number][section_name] = event.headers[i].name
            } else if (metadata_type == 'notApplicable'){
                var section_name = event.headers[i].column.split('__')[0]
                if (parseInt(event.rows[0][i]) == 1){
                    notApplicableDict[event_number][section_name] = true
                } else {
                    notApplicableDict[event_number][section_name] = false
                }
                notApplicableDict_ids[event_number][section_name] = event.headers[i].name
            }
        } else {
            dataElementObj.id = event.headers[i].name
            dataElementObj.value = parseFloat(event.rows[0][i])
            dataElementObj.type = event.headers[i].valueType
            dataElementObj.calculated = false
            dataElementObj.required = true
            dataElementObj.description = ''

            commodities[event_number][commodity_counter].dataElements.push(dataElementObj)
        }
    }
}



/*
    CREATION OF SECTION-OBJECTS
*/

function createSectionObject(event_number){
    sections[event_number] = []
    for (var i = 0; i < all_api_sections[event_number].length; i++){
        sections[event_number][i] = {}
        sections[event_number][i].id = all_api_sections[event_number][i].id
        sections[event_number][i].name = all_api_sections[event_number][i].displayName

        sections[event_number][i].completed = all_api_sections[event_number][i].completed
        sections[event_number][i].completed_id = all_api_sections[event_number][i].completed_id
        sections[event_number][i].notApplicable = all_api_sections[event_number][i].notApplicable
        sections[event_number][i].notApplicable_id = all_api_sections[event_number][i].notApplicable_id

        sections[event_number][i].commodities = []
        for(var j = 0; j < commodities[event_number].length; j++){
            for( var k = 0; k < all_api_sections[event_number][i].programStageDataElements.length; k++){
                if(commodities[event_number][j].dataElements.length > 0 && commodities[event_number][j].dataElements[0].id == all_api_sections[event_number][i].programStageDataElements[k].dataElement.id){
                    sections[event_number][i].commodities.push(commodities[event_number][j])
                }
            }

        }
    }
}


/*
    CREATION OF FORM OBJECTS
*/


function createFormObject(event_number){
    var event = all_api_events[event_number]

    var program_uid = event.rows[0][1]
    var event_id = event.rows[0][0]
    forms[event_number] = {}
    forms[event_number].lastUpdated = all_api_events[event_number].lastUpdated


    $.ajax({
        url: base_url + '/api/events/' + event_id + '.json',
        type: 'GET',
        async: false,
        error: function (data) {
            console.log("Error on retrieving data via API call")
        },
        success: function (json) {
            forms[event_number].completed = (json.status == 'COMPLETED') ? true : false;
        }
    });

    return $.ajax({
        url: base_url + '/api/programStages/' + program_uid + '.json?fields=description',
        type: 'GET',
        async: false,
        error: function (data) {
            console.log("Error on retrieving data via API call")
        },
        success: function (json) {
            forms[event_number].id= event_id;
            forms[event_number].approved = false;
            forms[event_number].name = json.description
            forms[event_number].sections = sections[event_number];
            return
        }
    });
}

/*
    CRETION OF CYCLES OBJECT
*/

function createCycleObject(event_number){
    cycles[event_number] = {};
    cycles[event_number].id = order_periods[event_number].id;
    cycles[event_number].name = order_periods[event_number].name;
    cycles[event_number].deadline = order_periods[event_number].deadline;
    cycles[event_number].forms =  [];
    cycles[event_number].forms[0] = forms[event_number];
}


/*
    UPDATING EVENTS ON SERVER
*/

function createPostEvent(orgUnitId, dataValuesArray, form_completed){
    post_obj = {};
    if (form_completed != undefined){
		if(form_completed){
        	post_obj.status = "COMPLETED"
		} else {
        	post_obj.status = "ACTIVE"
		}
    }

    post_obj.orgUnit = orgUnitId;
    post_obj.dataValues = dataValuesArray
    return post_obj;
}

function sendPUTDataToServer(jsonObject, eventId, form_completed) {
    return $.ajax({
        data: JSON.stringify(jsonObject),
        url: base_url + "/api/events/" + eventId + '?strategy=UPDATE',
        type: 'PUT',
        dataType: 'json',
        contentType:'application/json',
        error: function (data) {
            console.log('fail',data)
        },
        success: function (data) {
            console.log('success',data)
        }
    });
}

function createDataValuesArrayFromCommodity(commodity){
    var dataValuesArray = []
    for (var i = 0; i < commodity.dataElements.length; i++){
        var dataElementObject = {}
        dataElementObject.dataElement = commodity.dataElements[i].id
        dataElementObject.value = commodity.dataElements[i].value
        dataValuesArray.push(dataElementObject)
    }
    var metadata_object = {}
    metadata_object.dataElement = commodity.notApplicable_id
    metadata_object.value = !commodity.notApplicable
    dataValuesArray.push(metadata_object)

    metadata_object = {}
    metadata_object.dataElement = commodity.completed_id
    metadata_object.value = commodity.completed

    dataValuesArray.push(metadata_object)

    return dataValuesArray
}

function createDataValuesArrayFromSection(section){
    var dataValuesArray = []
    for(var i = 0; i < section.commodities.length; i++){
        var res = createDataValuesArrayFromCommodity(section.commodities[i])
        dataValuesArray = dataValuesArray.concat(res)
    }
    var metadata_object = {}
    metadata_object.dataElement = section.notApplicable_id
    metadata_object.value = section.notApplicable
    dataValuesArray.push(metadata_object)
    return dataValuesArray
}

function createDataValuesArrayFromForm(form){
    var dataValuesArray = []
    for(var i = 0; i < form.sections.length; i++){
        var res = createDataValuesArrayFromSection(form.sections[i])
        dataValuesArray = dataValuesArray.concat(res)
    }
    return dataValuesArray
}

function forceUpdateOnEventAnalytics(){
    return $.ajax({
        url: base_url + '/api/26/resourceTables/analytics?skipResourceTables=true&skipAggregate=true&skipEvents=false&skipEnrollment=true&lastYears=1',
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        error: function (data) {
            console.log('ANALYTICS_UPDATE_FAILURE',data)
        },
        success: function (data) {
            console.log('ANALYTICS_UPDATE_SUCCESS',data)
        }
    });
}

/*
    AUTO-FILL NEW EVENTS, AND UPDATE EVENTS
*/

function getAllBooleanDataElementIDs(){
    data_element_ids = []
    getRelevantData('dataElements', 'filter=shortName:^ilike:' + program_name + '&filter=valueType:eq:BOOLEAN&', 'id', function(data){
        for(var i = 0; i < data.dataElements.length; i++){
            data_element_ids.push(data.dataElements[i].id)
        }
    })
    return data_element_ids
}

function getAllCompletedDataElementIDs(){
    data_element_ids = []
    getRelevantData('dataElements', 'filter=shortName:^ilike:' + program_name + '&filter=valueType:eq:BOOLEAN&filter=displayName:$like:completed&', 'id', function(data){
        for(var i = 0; i < data.dataElements.length; i++){
            data_element_ids.push(data.dataElements[i].id)
        }
    })
    return data_element_ids
}
function getAllCommodityApplicableDataElementIDs(){
    data_element_ids = []
    getRelevantData('dataElements', 'filter=shortName:^ilike:' + program_name + '&filter=valueType:eq:BOOLEAN&filter=displayName:$like:applicable&', 'id', function(data){
        for(var i = 0; i < data.dataElements.length; i++){
            data_element_ids.push(data.dataElements[i].id)
        }
    })
    return data_element_ids
}

function getAllBooleanDataElementExceptCommodityApplicableIDs(){
    data_element_ids = []
    getRelevantData('dataElements', 'filter=shortName:^ilike:' + program_name + '&filter=valueType:eq:BOOLEAN&filter=displayName:!$like:applicable&', 'id', function(data){
        for(var i = 0; i < data.dataElements.length; i++){
            data_element_ids.push(data.dataElements[i].id)
        }
    })
    return data_element_ids
}

function getAllOtherDataElementIDs(){
    data_element_ids = []
    getRelevantData('dataElements', 'filter=shortName:^ilike:' + program_name + '&filter=valueType:eq:BOOLEAN&filter=displayName:!$like:completed&', 'id', function(data){
        for(var i = 0; i < data.dataElements.length; i++){
            data_element_ids.push(data.dataElements[i].id)
        }
    })
    return data_element_ids
}

function getAllNONBooleanDataElementIDs(){
    data_element_ids = []
    getRelevantData('dataElements', 'filter=shortName:^ilike:' + program_name + '&filter=valueType:eq:NUMBER&', 'id', function(data){
        for(var i = 0; i < data.dataElements.length; i++){
            data_element_ids.push(data.dataElements[i].id)
        }
    })
    return data_element_ids
}

function createDataValuesArray(data_element_ids, data_element_values){
    data_values_array = []
    for (var i = 0; i < data_element_ids.length; i++){
        data_values_array.push({dataElement: data_element_ids[i], value: data_element_values[i]})
    }
    return data_values_array;
}

function createNewPostEvent(programId, programStage, orgUnitId, data_element_ids, data_element_values, user_code, posting_date){
    post_obj = {};
    post_obj.program = programId;
    post_obj.programStage = programStage;
    post_obj.eventDate = posting_date;
    post_obj.status = 'ACTIVE';
    post_obj.storedBy = user_code;
    post_obj.orgUnit = orgUnitId;
    post_obj.dataValues = createDataValuesArray(data_element_ids, data_element_values)
    return post_obj;
}

function sendPOSTdataToServer(jsonObject) {
    return $.ajax({
        data: JSON.stringify(jsonObject),
        url: base_url + "/api/events",
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        error: function (data) {
            console.log("ERROR",data)
        },
        success: function (data) {
            console.log("SUCCESS",data)
        }
    });
}

function createArrayFullOfZeros(size){
    return Array.apply(null, Array(size)).map(Number.prototype.valueOf,0);
}

function createArrayFullOfBooleans(size, bool_value){
    return Array.apply(null, Array(size)).map(Boolean.prototype.valueOf,bool_value);
}

function updateEventWithBlanks(orgunit_id, event_id){
    var all_ids = getAllIDs()
    var all_values = getAllInitialisedValues()
    var jsn = createPostEvent(orgunit_id, createDataValuesArray(all_ids, all_values), false);
    return sendPUTDataToServer(jsn, event_id);
}

function getAllIDs(){
    var all_non_bool_ids = getAllNONBooleanDataElementIDs()

    var all_bool_ids_1 = getAllCommodityApplicableDataElementIDs()
    var all_bool_ids_2 =  getAllBooleanDataElementExceptCommodityApplicableIDs()
    var all_bool_ids = all_bool_ids_1.concat(all_bool_ids_2)

    var all_ids = all_non_bool_ids.concat(all_bool_ids)
    return all_ids
}

function getAllInitialisedValues(){
    var all_bool_ids_1 = getAllCommodityApplicableDataElementIDs()
    var all_bool_ids_2 =  getAllBooleanDataElementExceptCommodityApplicableIDs()
    var all_bool_ids = all_bool_ids_1.concat(all_bool_ids_2)

    var all_bool_ids_values_1 = createArrayFullOfBooleans(all_bool_ids_1.length, true)
    var all_bool_ids_values_2 = createArrayFullOfBooleans(all_bool_ids_2.length, false)
    var all_bool_values = all_bool_ids_values_1.concat(all_bool_ids_values_2)

    var all_non_bool_ids = getAllNONBooleanDataElementIDs()
    var all_non_bool_values = createArrayFullOfZeros(all_non_bool_ids.length)

    var all_values = all_non_bool_values.concat(all_bool_values)
    return all_values
}

function createBlankEvent(program_id, program_stage_id, orgunit_id, posting_date = '2017-01-01'){
    var all_ids = getAllIDs()
    var all_values = getAllInitialisedValues()
    var jsn = createNewPostEvent(program_id, program_stage_id, orgunit_id, all_ids, all_values, 'admin');
    return sendPOSTdataToServer(jsn);
}


/*
    THE SERVER-INTERFACE
*/

var server_interface = {
    facility:{},
    form:{},
    setFacility:
        function(id){
            return createCyclesObject(program_id, id).then(function(){
                facility = {}
                facility.id = id
                $.ajax({
                    url: base_url + '/api/organisationUnits.json?paging=false&filter=id:eq:' + id + '&fields=displayName',
                    type: 'GET',
                    async: false,
                    error: function (data) {
                        console.log("Error on retrieving data via API call")
                    },
                    success: function (json) {
                        facility.name = json.organisationUnits[0].displayName
                    }
                });
                facility.cycles = cycles
            })
        },
    setLightWeightFacility:
        function(id){
            return createLightWeightCyclesObject(program_id, id).then(function(){
                facility = {}
                facility.id = id
                $.ajax({
                    url: base_url + '/api/organisationUnits.json?paging=false&filter=id:eq:' + id + '&fields=displayName',
                    type: 'GET',
                    async: false,
                    error: function (data) {
                        console.log("Error on retrieving data via API call")
                    },
                    success: function (json) {
                        facility.name = json.organisationUnits[0].displayName
                    }
                });
                facility.cycles = cycles
                for(var i = 0; i < facility.cycles.length; i++){
                    facility.cycles[i].forms[0].sections = []
                }
            }, function(){
                console.log("error in setLightWeightFacility()")
            })
    },
    setForm:
        function(orgunit_id, id){
            return createCyclesObjectFromEventId(id, orgunit_id)
        },
    updateFormOnServer:
        function(orgUnitId, form){
            var jsn = createPostEvent(orgUnitId, createDataValuesArrayFromForm(form), form.completed);
            return sendPUTDataToServer(jsn, form.id).then(function(){
                return forceUpdateOnEventAnalytics()
            })
        },
    updateSectionOnServer:
        function(orgUnitId, eventID, section){
            var jsn = createPostEvent(orgUnitId, createDataValuesArrayFromSection(section, eventID));
            return sendPUTDataToServer(jsn, eventID).then(function(){
                return forceUpdateOnEventAnalytics()
            })
        },
    updateCommodityOnServer:
        function(orgUnitId, eventID, commodity){
            var jsn = createPostEvent(orgUnitId, createDataValuesArrayFromCommodity(commodity, eventID));
            return sendPUTDataToServer(jsn, eventID).then(function(){
                return forceUpdateOnEventAnalytics()
            })
        },
    updateEventWithBlanks:
        function(orgunit_id, event_id){
            updateEventWithBlanks(orgunit_id, event_id).then(function(){
                forceUpdateOnEventAnalytics()
                console.log("UPDATED EVENT WITH BLANKS")
            })
        },
    createBlankEvent:
        function(program_id, program_stage_id, orgunit_id, posting_date){
            createBlankEvent(program_id, program_stage_id, orgunit_id, posting_date).then(function(){
                forceUpdateOnEventAnalytics()
                console.log("CREATED BLANK EVENT")
            })
        },
    setFacilities:
        function(){
            return $.ajax({
                url: base_url + "/api/me.json?fields=organisationUnits[id,name]",
                type: 'GET',
                dataType: 'json',
                contentType:'application/json',
                error: function (data) {
                    console.log("ERROR",data)
                },
                success: function (data) {
                    all_facilities_information = data.organisationUnits
                    console.log("SUCCESS",data)
                }
            });
        }
}
