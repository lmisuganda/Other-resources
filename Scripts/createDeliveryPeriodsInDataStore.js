function postToStore(jsonObject, app_namespace, store_key) {
    return $.ajax({
        data: JSON.stringify(jsonObject),
        url: '/dhis/api/26/dataStore/' + app_namespace + '/' + store_key,
        type: 'POST',
        async: true,
        dataType: 'json',
        contentType:'application/json',
        error: function (data) {
            console.log("Error: ", data)
        },
        success: function (data) {
            console.log("Created: " + data, data)
        }
    });
}

function createDataStoreObject(warehouse_periods, warehouse_name){
    storeObj = {}

    for (var i = 0; i < warehouse_periods.length; i++){
        zone = []
        zoneNumber = (i+1)
        for(var j = 0; j < warehouse_periods[i].length; j++){
            period = {}
            periodNumber = (j+1)
            period.id = (zoneNumber) + '_' + warehouse_periods[i][j]
            period.name = periodNumber
            period.deadline = warehouse_periods[i][j]
            zone.push(period)
        }

        warehouse_periods[i]
        storeObj[warehouse_name + '_zone_' + zoneNumber] = zone
    }
    return storeObj
}

nms_periods = []

// dates for 2015/2016 order year, in YYYY-MM-DD format
nms_zone1_periods = ['2017-06-17', '2017-08-19', '2017-10-13', '2017-12-04', '2018-02-19', '2018-04-14']
nms_zone2_periods = ['2017-07-06', '2017-09-09', '2017-11-03', '2018-01-18', '2018-04-14', '2018-05-09']
nms_zone3_periods = ['2017-07-28', '2017-09-18', '2017-11-12', '2018-01-28', '2018-03-23', '2018-05-18']
nms_zone4_periods = ['2017-08-05', '2017-09-28', '2017-11-15', '2018-02-05', '2018-03-31', '2018-05-26']
nms_zone5_periods = ['2017-08-14', '2017-10-07', '2017-11-18', '2018-02-16', '2018-04-11', '2018-06-07']


nms_periods.push(nms_zone1_periods)
nms_periods.push(nms_zone2_periods)
nms_periods.push(nms_zone3_periods)
nms_periods.push(nms_zone4_periods)
nms_periods.push(nms_zone5_periods)

var warehouse_name = 'nms'
postToStore(createDataStoreObject(nms_periods, warehouse_name), 'ConfigurationLMIS', 'warehouses')
