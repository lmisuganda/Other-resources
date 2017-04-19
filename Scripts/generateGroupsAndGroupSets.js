// For Live-server, use /api, and for demo server instances, use /api on the HTTP calls in this file

function createDataElementGroup(name_of_data_element_group, list_of_data_element_ids){
    new_data_element_group = {};
    new_data_element_group.name = name_of_data_element_group; // mandatory field
    new_data_element_group.dataElements = [];
    for (var i = 0; i < list_of_data_element_ids.length; i++){
        new_data_element_group.dataElements.push({"id": list_of_data_element_ids[i]})
    }
    return new_data_element_group;
}

function createDataElementGroupSet(name_of_data_element_group_set, list_of_data_element_group_ids){
    new_data_element_group_set = {};
    new_data_element_group_set.name = name_of_data_element_group_set; // mandatory field
    new_data_element_group_set.dataElementGroups = [];
    new_data_element_group_set.dataDimension = true; // mandatory field
    for (var i = 0; i < list_of_data_element_group_ids.length; i++){
        new_data_element_group_set.dataElementGroups.push({"id": list_of_data_element_group_ids[i]})
    }
    return new_data_element_group_set;
}

function sendDataElementGroupToServer(jsonObject) {
    return $.ajax({
        data: JSON.stringify(jsonObject),
        url: "/dhis/api/dataElementGroups",
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        authorization: "Bearer 7fa34aca-a5ba-485b-b108-b18faad54c6d",
        error: function (data) {
            console.log("error: ", data)
        },
        success: function (data) {
            console.log("success: ", data)
        }
    });
}

function sendDataElementGroupSetToServer(jsonObject) {
    return $.ajax({
        data: JSON.stringify(jsonObject),
        url: "/dhis/api/dataElementGroupSets",
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        authorization: "Bearer 7fa34aca-a5ba-485b-b108-b18faad54c6d",
        error: function (data) {
            console.log("not correctly generated Data Element GroupSet", data)
        },
        success: function (data) {
            console.log("Correctly generated Data Element GroupSet", data)
        }
    });
}

function getRelevantData(kind_of_data, filter, fields, callback){
    return $.ajax({
        url: '/dhis/api/' + kind_of_data + '.jsonp?' + filter + 'paging=false&fields=' + fields,
        type: 'GET',
        dataType: 'jsonp',
        contentType:'application/jsonp',
        authorization: "Bearer 7fa34aca-a5ba-485b-b108-b18faad54c6d",
        error: function (data) {
            console.log("Error on retrieving data from API call")
        },
        success: function (data) {
            callback(data)
            console.log("Successfully retrieved data from API call: " + kind_of_data)
        }
    });
}

function getOnlyCommodityName(long_name){
    return long_name.split('__')[0]
}

function getOnlyCommodityOperationName(long_name){
    return long_name.split('__')[1]
}

function getOnlyCommodityOperationAbbreviation(long_name){
    arr = long_name.split('__')
    commodityOperationAbbreviation = arr[arr.length-1]
    return commodityOperationAbbreviation
}

all_commodity_operations = []
all_commodity_group_names = []

function createDataElementGroupsForEveryCommodity(all_data_elements){
    var NUMBER_OF_FIELDS_PER_COMMODITY = 9;
    var field_counter = 1;
    data_elements = all_data_elements.dataElements;
    for(var i = 0; i < data_elements.length; i+=NUMBER_OF_FIELDS_PER_COMMODITY){
        list_of_ids = []
        data_element_group_name = getOnlyCommodityName(data_elements[i].formName)
        for(var j = 0; j < NUMBER_OF_FIELDS_PER_COMMODITY; j++){
            all_commodity_operations[j] = getOnlyCommodityOperationName(data_elements[i+j].formName)
            list_of_ids.push(data_elements[i+j].id)
        }
        sendDataElementGroupToServer(createDataElementGroup(data_element_group_name, list_of_ids))
        all_commodity_group_names.push(data_element_group_name)
    }
}

function createDataElementGroupsForEveryCommodityOperation(all_data_elements){
    data_elements = all_data_elements.dataElements;
    all_data_element_ids = []
    commodity_operation_name = getOnlyCommodityOperationName(data_elements[0].displayName);
    for(var j = 0; j < data_elements.length; j++){
        all_data_element_ids.push(data_elements[j].id);
    }
    sendDataElementGroupToServer(createDataElementGroup(commodity_operation_name, all_data_element_ids))
}

function handleCommodityGroupSet(all_data_elements){
    data_element_groups = all_data_elements.dataElementGroups
    list_of_data_element_group_ids = includeOnlyRelevantCommodityGroups(data_element_groups)
    sendDataElementGroupSetToServer(createDataElementGroupSet('Commodity', list_of_data_element_group_ids))
}

function handleCommodityOperationGroupSet(all_data_elements){
    data_element_groups = all_data_elements.dataElementGroups
    list_of_data_element_group_ids = includeOnlyRelevantCommodityOperationGroups(data_element_groups)
    sendDataElementGroupSetToServer(createDataElementGroupSet('Commodity Operations', list_of_data_element_group_ids))
}

function inArray(string, array){
    for(var i = 0; i < array.length; i++){
        if (array[i].indexOf(string) >= 0 || array[i] === string){
            return true;
        }
    }
    return false;
}

function includeOnlyRelevantCommodityOperationGroups(data_element_groups){
    commodity_operation_groups_IDs_to_include = []
    for (var i = 0; i < data_element_groups.length; i++){
        if (inArray(data_element_groups[i].displayName, all_commodity_operations)){
            commodity_operation_groups_IDs_to_include.push(data_element_groups[i].id);
        }
    }
    return commodity_operation_groups_IDs_to_include;
}

function includeOnlyRelevantCommodityGroups(data_element_groups){
    commodity_groups_IDs_to_include = []
    for (var i = 0; i < data_element_groups.length; i++){
        if (inArray(data_element_groups[i].displayName, all_commodity_group_names)){
            commodity_groups_IDs_to_include.push(data_element_groups[i].id);
        }
    }
    return commodity_groups_IDs_to_include;
}

DELAY_FOR_AWAITING_NEW_DATABASE_ENTRIES = 3000;

getRelevantData('dataElements', 'filter=shortName:like:ARV_&', 'name,formName,id', createDataElementGroupsForEveryCommodity).then(function(){
    for(var i = 0; i < all_commodity_operations.length; i++){
        getRelevantData('dataElements', 'filter=displayName:like:' + all_commodity_operations[i] + '&', 'name,displayName,formName,id',createDataElementGroupsForEveryCommodityOperation)
    }
}).then(setTimeout(function(){
    getRelevantData('dataElementGroups', '', 'id,displayName', handleCommodityGroupSet)
}, DELAY_FOR_AWAITING_NEW_DATABASE_ENTRIES)).then(setTimeout(function(){
    getRelevantData('dataElementGroups', '', 'id,displayName', handleCommodityOperationGroupSet)
}, DELAY_FOR_AWAITING_NEW_DATABASE_ENTRIES))
