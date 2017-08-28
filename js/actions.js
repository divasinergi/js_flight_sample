$(document).ready(function() {
    
    var myAirlines = '';
    var myToken = '';
    var myData = '';
    var myAvailKey  = '';

    /*  jika di klik tombol save konfigurasi  */
    $("#btnsaveconfig").click(function(){
        $("#divconfig").fadeOut(500, function() {
            $("#divauth").fadeIn(100);
            $("#txtuser").focus();
        });
    });

    
    /*  menghalau pindah halaman  */
    $("#form1").submit(function(){ return false; });

    /*  mengambil token dan pindah step selanjutnya  */
    $("#btngettoken").click(function(){
        var authData = JSON.stringify({"user":$("#txtuser").val(),"pass":$("#txtpass").val()}) ;
        var authlogin=$("#linkauth").val();
        $.ajax({
            url: authlogin,
            type: "post",
            data: authData,
            datatype: 'json',
            beforeSend: function() {
                $("#msgauth").html('<img src="images/loadings.gif">');
                $("#txtuser").attr('disabled','disabled');
                $("#txtpass").attr('disabled','disabled');
                $("#btngettoken").removeAttr('class');
                $("#btngettoken").attr('class','btn btn-inverse');
                $("#btngettoken").attr('disabled','disabled');
            },
            success: function(e){
                if(typeof e.Data.Token !== 'undefined'){
                    myToken = e.Data.Token;
                    $("#msgauth").html('');
                    $("#divauth").fadeOut(500, function() {
                        $("#divsearch").fadeIn(100);
                        getDataAirport();
                        $("#tokeninfo").html(myToken);
                    });
                }else{
                    $("#msgauth").html('<span class="alert alert-warning"><strong><i class="icon-warning-sign"></i>&nbsp;'+e.ErrCode.Msg+'</strong></span>');
                    $("#txtuser").val('');
                    $("#txtpass").val('');
                    $("#txtuser").focus();
                }
            },
            error: function(e){
                $("#msgauth").html('<span class="alert alert-danger"><strong><i class="icon-remove-sign"></i>&nbsp;Error Connecting</strong></span>');
            }
        });
        $("#txtuser").removeAttr('disabled');
        $("#txtpass").removeAttr('disabled');
        $("#btngettoken").removeAttr('disabled');
        $("#btngettoken").removeAttr('class');
        $("#btngettoken").attr('class','btn btn-primary');
    });



    /*  datepicker pergi  */
    $('#datepick').datepicker({
        dateFormat: 'dd-mm-yy',
        minDate: '+0d',
        onSelect: function (dateText, inst) {
            $("#datepick2").datepicker("option", "minDate", $("#datepick").datepicker("getDate"));
        }
    }).val();
    /*  datepicker pulang */
    $('#datepick2').datepicker({
        dateFormat: 'dd-mm-yy',
        minDate: '+0d',
        onSelect: function (dateText, inst) {
            $("#datepick2").datepicker("option", "minDate", $("#datepick").datepicker("getDate"));
        }
    }).val();

    /* mengambil Data Airport */
    function getDataAirport(){
        $.get( "airports.json", function( data ) {
            data.sort(function(a, b) {
                var nameA = a.country.toUpperCase(); // ignore upper and lowercase
                var nameB = b.country.toUpperCase(); // ignore upper and lowercase
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            });
            for (var i = 0; i < data.length; i++){
                $('#origin,#dest').append($("<option></option>")
                .attr("value",data[i].code)
                .text(data[i].country+', '+data[i].city+', '+data[i].name));
            }
        });
        $('#origin').select2();
        $('#dest').select2();
    }

    /* mengambil Data Airlines */
    $.get( "airlines.json", function( data ) { myAirlines = data; });

    
    

    /* konversi format tanggal */
    function converDatestr(str){
        return str.split('-').reverse().join('-');
    }



    /* Hitung Durasi */
    function countDuration(jam){
        jam1 = jam.substr(0,2);
        jam11 = jam.substr(3,2);
        menit = parseInt(jam11)+parseInt(0);
        jamjam = parseInt(jam1)*60;
        return parseInt(menit) + parseInt(jamjam);
    }

    /* Konversi Durasi menit ke detail jam */
    function convDuration(menit){
        jam = Math.floor(parseInt(menit)/60);          
        menitx = parseInt(menit) % 60; 
        if(jam<=9) { jam = '0'+jam }
        if(menitx<=9) { menitx = '0'+menitx }
        return jam+':'+menitx;
    }
    
        


    /* Jika checkBox di klik */
    $('#checkreturn').click(function () {
        if ($('#checkreturn').is(':checked')) {
            $('#datepick2').removeAttr("disabled");
        } else {
            $('#datepick2').attr("disabled", "disabled");
            $('#datepick2').val("");
        }
    });



    /*  mengambil Flight Available dan menampilkannya  */
    $("#btnsearch").click(function(){
        var availURL = $("#linkflightavail").val();
        //var availURL    = "avail.json";
        var origin      = $("#origin").val();
        var dest        = $("#dest").val();
        var datepick    = $("#datepick").val();
        var datepick2   = $("#datepick2").val();
        var adult       = $("#adult").val();
        var child       = $("#child").val();
        var infant      = $("#infant").val();
        var vPax        = [parseInt(adult),parseInt(child),parseInt(infant)];
        var pax_x       = '<br/><i class="icon-group"></i> Dewasa : '+adult+', Anak : '+child+', Bayi : '+infant;

        if ($('#checkreturn').is(':checked')) {
            var vOrigin = origin+','+dest;
            var vDest   = dest+','+origin;
            var vDate   = converDatestr(datepick)+','+converDatestr(datepick2);
            var rute_x  = origin+' <i class="icon-exchange"></i> '+dest;
            var date_x  = datepick+' <i class="icon-exchange"></i> '+datepick2;
        } else {
            var vOrigin = origin;
            var vDest   = dest;
            var vDate   = converDatestr(datepick);
            var rute_x  = origin+' <i class="icon-long-arrow-right"></i> '+dest;
            var date_x  = datepick;
        }

        var requestData = JSON.stringify(
            {
                "Token" : myToken,
                "Origin" : [vOrigin],
                "Destination" : [vDest],
                "Page" :
                {
                    "start" : 1,
                    "offset" : 10
                },
                "Departure" : [vDate],
                "Pax" : vPax,
                "AirPref" : ["GA"],
                "Credential" : 
                [
                    {
                        "webflix" :
                        {
                        "user"  : "user",
                        "pass"  : "pass",
                        "val01" : "AB12",
                        "val03" : "",
                        "url"   : "https://xxxx.com/xxx"
                        }
                    }
                ]
            }
        );
        $("#divAvail").fadeOut(500);
        $.ajax({
            url: availURL,
            type: "post",
            data: requestData,
            datatype: 'json',
            beforeSend: function() {
                $("#divProgress").html('<img src="images/loadings.gif"><br/>Please Wait');
                $("#btnsearch").removeAttr('class');
                $("#btnsearch").attr('class','btn btn-inverse');
                $("#btnsearch").attr('disabled','disabled');
            },
            success: function(e){
                if(typeof e.Data !== '-'){
                    $("#divProgress").html('');
                    $("#divAvail").fadeIn(100);
                    $("#divrute").html(rute_x);
                    $("#divdate").html(date_x);
                    $("#divPax").html(pax_x);
                    myData = e.Data;
                    myAvailKey = e.avail_key;
                    putDataAvail(e.Data);
                }else{
                    $("#divProgress").html('<div class="alert alert-warning"><strong><i class="icon-warning-sign"></i>&nbsp;'+e.ErrCode.Msg+'</strong></div>');
                }
            },
            error: function(e){
                $("#divProgress").html('<div class="alert alert-danger"><strong><i class="icon-remove-sign"></i>&nbsp;Error Connecting</strong></div>');
            }
        });
        $("#btnsearch").removeAttr('disabled');
        $("#btnsearch").removeAttr('class');
        $("#btnsearch").attr('class','btn btn-primary');
    });

    function getAirlines(code) {
        return myAirlines.filter(
            function(myAirlines){return myAirlines.code == code}
        );
        
    }



    /*  Menampilkan data yang didapat ke tabel */
    function putDataAvail(dataX){
        var myTbody = $("#tableAvail tbody");
        
        dataX.sort(function(a, b) {
            var nameA = a.departure.toUpperCase();
            var nameB = b.departure.toUpperCase();
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        });


        for (var i = 0; i < dataX.length; i++){
            var x = dataX[i];
            var y = x.PassengerPrice;
            var airlineName = getAirlines(x.operatingAirline)[0].name;
            var cur= y[0].currency;
            var leg = x.leg;
            var br_u = '';
            var imgtransit = '';
            var imgicon    = '';
            var durasi = 0;
            for (var u = 0; u < leg.length; u++){
                departT = leg[u].departureDateTime.split('T');
                imgicon    = imgicon +'<img src="images/icons/'+leg[u].operatingAirline+'.png" width="30px" height="30px"> ';
                imgtransit = imgtransit + br_u + '<img src="images/icons/'+leg[u].operatingAirline+'.png" width="45px" height="45px"> &nbsp; '+departT[1].substr(0,5)+' &nbsp; '+leg[u].originLocation+' <i class="icon-long-arrow-right"></i> '+leg[u].destinationLocation+'<br/>'+leg[u].operatingAirline+' '+leg[u].operatingAirlineFlightNumber;
                br_u = '<br/>';
                durasi = parseInt(durasi) + countDuration(leg[u].duration.substr(0,5));
            }

            durasi = convDuration(durasi);

            if(leg.length>=2){
                myTbody.append('<tr>'+
                    '<td>'+
                        '<div class="row-fluid">'+
                            '<div class="span3">'+
                                imgicon+
                            '</div>'+
                            '<div class="span9" style="padding-top:10px">'+
                                '<strong style="font-size:16pt">'+airlineName+'</strong><br>'+
                                '<a href="#rin'+i+'" class="accordion-toggle collapsed" data-toggle="collapse" data-parent="#divAvail" style="color:red;text-decoration:none">Transit <i class="icon-caret-down"></i></a>'+
                                '<div id="rin'+i+'" class="accordion-body collapse">'+
                                    imgtransit+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</td>'+
                    '<td align="center">'+
                        '<b style="font-size:10pt">'+x.departureTime.substr(0,5)+'</b>'+
                    '</td>'+
                    '<td align="center">'+x.arrivalTime.substr(0,5)+'</td>'+
                    '<td align="center">'+durasi+'</td>'+
                    '<td align="right"><sub>'+cur+'</sub> <b style="font-size:18pt">'+x.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")+'</b></td>'+
                    '<td>'+
                        '<button type="button" class="btn btn-success"><i class="icon-circle-arrow-right"></i> Pilih</button>'+
                    '</td>'+
                '</tr>');
            }else{
                myTbody.append('<tr>'+
                    '<td>'+
                        '<div class="row-fluid">'+
                            '<div class="span3">'+
                                imgicon+'<br>'+
                                x.operatingAirline+' '+x.operatingFlight+
                            '</div>'+
                            '<div class="span9" style="padding-top:10px">'+
                                '<strong style="font-size:16pt">'+airlineName+'</strong><br>'+
                                'Langsung'+
                            '</div>'+
                        '</div>'+
                    '</td>'+
                    '<td align="center">'+
                        '<b style="font-size:10pt">'+x.departureTime.substr(0, 5)+'</b>'+
                    '</td>'+
                    '<td align="center">'+x.arrivalTime.substr(0, 5)+'</td>'+
                    '<td align="center">'+durasi+'</td>'+
                    '<td align="right"><sub>'+cur+'</sub> <b style="font-size:18pt">'+x.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")+'</b></td>'+
                    '<td>'+
                        '<button type="button" class="btn btn-success"><i class="icon-circle-arrow-right"></i> Pilih</button>'+
                    '</td>'+
                '</tr>');
            }
        }
    }

});