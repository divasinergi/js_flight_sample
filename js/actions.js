$(document).ready(function() {
    
    // Variable Pendahuluan //
    var myAirlines  = '';
    var myToken     = '';
    var myData      = '';
    var myAvailKey  = '';
    var total_item  = 0 ;
    var startPage   = 1;
    var limitPage   = 10;
    var PageX       = 0;
    var sortBy      = 'airlines';
    var sortTo      = 'ASC';

    // Variable Konfigurasi Pencarian //
    var origin      = '';
    var dest        = '';
    var datepick    = '';
    var datepick2   = '';
    var adult       = '';
    var child       = '';
    var infant      = '';
    var vPax        = '';
    var pax_x       = '';
    var checkreturn = '';


    ////////////////////////////////////////////
    /*  jika di klik tombol save konfigurasi  */
    ////////////////////////////////////////////
    $("#btnsaveconfig").click(function(){
        $("#divconfig").fadeOut(500, function() {
            $("#divauth").fadeIn(100);
            $("#txtuser").focus();
        });
    });
    // .-->


    /////////////////////////////////////////////////
    /*  menghalau pindah halaman dari action form  */
    /////////////////////////////////////////////////
    $("#form1").submit(function(){ return false; });
    // .-->


    ///////////////////////////////////////////////////
    /*  mengambil token dan pindah step selanjutnya  */
    ///////////////////////////////////////////////////
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
                        $("#tokeninfo").html(myToken);
                        /* mengambil Data Airport */
                        getDataAirport();
                        /* mengambil Data Airlines */
                        $.get( "airlines.json", function( data ) { myAirlines = data; });
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
    // .-->


    ///////////////////////////////////
    /*  Set datepicker pulang pergi  */
    ///////////////////////////////////

    /*  datepicker pulang */
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

    /*  Set Tanggal Sekarang */
    var d = new Date();
    d.setDate(d.getDate() + 1);
    var day = (d.getDate()<10 ? '0' : '') + d.getDate();
    var month = d.getMonth()+1;
    var month = (month<10 ? '0' : '') + month;
    var year = d.getFullYear();
    var valNow = day+'-'+month+'-'+year;
    $('#datepick').val(valNow);

    /* Jika checkBox di klik */
    $('#checkreturn').click(function () {
        var pick2 = $('#datepick2');
        if ($(this).is(':checked')) {
            pick2.removeAttr("disabled");
            pick2.val($('#datepick').val());
        } else {
            pick2.attr("disabled", "disabled");
            pick2.val("");
        }
    });
    // .-->


    /////////////////////////////////
    /*  klik aktifkan tombol cari  */
    /////////////////////////////////
    $("#btnEnableSearch").click(function(){
        $("#btnEnableSearch").hide();
        $("#btnsearch").show();
    });
    // .-->


    ////////////////////////////
    /* mengambil Data Airport */
    ////////////////////////////
    function getDataAirport(){
        $.get( "airports.json", function( data ) {
            data.sort(function(a, b) {
                var nameA = a.country.toUpperCase();
                var nameB = b.country.toUpperCase();
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
    // .-->
    

    //////////////////////////////////////////////////////////////////////////////////
    /*  klik Tombol Cari Penerbangan mengambil Flight Available dan menampilkannya  */
    //////////////////////////////////////////////////////////////////////////////////
    $("#btnsearch").click(function(){
        origin      = $("#origin").val();
        dest        = $("#dest").val();
        datepick    = $("#datepick").val();
        datepick2   = $("#datepick2").val();
        adult       = $("#adult").val();
        child       = $("#child").val();
        infant      = $("#infant").val();
        vPax        = [parseInt(adult),parseInt(child),parseInt(infant)];
        pax_x       = '<br/><i class="icon-group"></i> Dewasa : '+adult+', Anak : '+child+', Bayi : '+infant;
        checkreturn = ($('#checkreturn').is(':checked')) ? 'true' : 'false';
        $("#btnEnableSearch").show();
        $("#btnsearch").hide();
        $("#divAvail").fadeOut(500);
        $("#divProgress").html('<img src="images/loadings.gif"><br/>Please Wait');
        sortNormalStyle();
        progressData();
    });
    // .-->



    //////////////////////////////////////////////////////////////////////////////////
    /*                 Proses Request Response dan menampilkannya                   */
    //////////////////////////////////////////////////////////////////////////////////
    function progressData(){
        //var availURL = $("#linkflightavail").val();
        var availURL    = "avail.json";
        if (checkreturn == 'true') {
            vOrigin = origin+','+dest;
            vDest   = dest+','+origin;
            vDate   = converDatestr(datepick)+','+converDatestr(datepick2);
            rute_x  = origin+' <i class="icon-exchange"></i> '+dest;
            date_x  = datepick+' <i class="icon-exchange"></i> '+datepick2;
        } else {
            vOrigin = origin;
            vDest   = dest;
            vDate   = converDatestr(datepick);
            rute_x  = origin+' <i class="icon-long-arrow-right"></i> '+dest;
            date_x  = datepick;
        }

        var requestData = JSON.stringify(
            {
                "Token" : myToken,
                "Origin" : [vOrigin],
                "Destination" : [vDest],
                "Page" :
                {
                    "start" : parseInt(startPage),
                    "offset" : parseInt(limitPage)
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
        
        $.ajax({
            url: availURL,
            type: "post",
            data: requestData,
            datatype: 'json',
            beforeSend: function() {
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
                    total_item = e.total_item;
                    PageX = countPage(e.total_item,limitPage);
                    $("#tablepagination").html(navPagination(startPage,PageX));
                    putDataAvail(myData);
                }else{
                    $("#divProgress").html('<div class="alert alert-warning"><strong><i class="icon-warning-sign"></i>&nbsp;'+e.ErrCode.Msg+'</strong></div>');
                    $("#tablepagination").html('');
                }
            },
            error: function(e){
                $("#divProgress").html('<div class="alert alert-danger"><strong><i class="icon-remove-sign"></i>&nbsp;Error Connecting</strong></div>');
                $("#tablepagination").html('');
            }
        });
    };
    // .-->


    /*  Menampilkan data yang didapat ke tabel */
    function putDataAvail(dataX){
        var myTbody = $("#tableAvail tbody");
        myTbody.html('');
        //myTbody.html('<tr><td colspan="6"><div align="center"><img src="images/loadings.gif"></div></td></tr>');

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

        //for (var i = 0; i < dataX.length; i++){
        for (var i = 0; i < 5; i++){
            var x = dataX[i];
            var y = x.PassengerPrice;
            var airlineName = getAirlineName(x.operatingAirline)[0].name;
            //if(typeof airlineName !== 'undefined'){ alert(i);throw '';}
            var cur= y[0].currency;
            var leg = x.leg;
            var br_u = '';
            var imgtransit = '';
            var imgicon    = '';
            var durasi = 0;
            var singleIMG = ''; var singleIMG = [];
            for (var u = 0; u < leg.length; u++){
                departT = leg[u].departureDateTime.split('T');
                var foundPresent = singleIMG.indexOf(leg[u].operatingAirline) > -1;
                if(!foundPresent){ imgicon += '<img src="images/icons/'+leg[u].operatingAirline+'.png" width="30px" height="30px"> '; }
                imgtransit += br_u + '<img src="images/icons/'+leg[u].operatingAirline+'.png" width="45px" height="45px"> &nbsp; '+departT[1].substr(0,5)+' &nbsp; '+leg[u].originLocation+' <i class="icon-long-arrow-right"></i> '+leg[u].destinationLocation+'<br/>'+leg[u].operatingAirline+' '+leg[u].operatingAirlineFlightNumber;
                br_u = '<br/>';
                durasi = parseInt(durasi) + countDuration(leg[u].duration.substr(0,5));
                singleIMG.push(leg[u].operatingAirline);
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


    //////////////////////////////////////////////////////////////////////
    /*   Mengambil Nama Maskapai dengan cara mencocokan Code Maskapai   */
    //////////////////////////////////////////////////////////////////////
    function getAirlineName(code) {
        return myAirlines.filter(
            function(myAirlines){return myAirlines.code == code}
        );
    }
    // .-->
    

    ////////////////////////////////////////////////////////////
    /*   Sorting Data by Airline, waktu berangkat dan harga   */
    ////////////////////////////////////////////////////////////
    var attrib_sortAirline  = 'normal';
    var attrib_sortDepart   = 'normal';
    var attrib_sortPrice    = 'normal';
	$("#sortAirline").click(function(){
        caretBefore = attrib_sortAirline;
        sortNormalStyle();
        sortBy = 'airlines';
        if(caretBefore=='asc'){
            $(this).html('<i class="icon-caret-down"></i>');
            attrib_sortAirline = 'desc';
            sortTo = 'DESC';
        }else{
            $(this).html('<i class="icon-caret-up"></i>');
            attrib_sortAirline = 'asc';
            sortTo = 'ASC';
        }
    });
    $("#sortDepart").click(function(){
        caretBefore = attrib_sortDepart;
        sortNormalStyle();
        sortBy = 'departure';
        if(caretBefore=='asc'){
            $(this).html('<i class="icon-caret-down"></i>');
            attrib_sortDepart = 'desc';
            sortTo = 'DESC';
        }else{
            $(this).html('<i class="icon-caret-up"></i>');
            attrib_sortDepart = 'asc';
            sortTo = 'ASC';
        }
    });
    $("#sortPrice").click(function(){
        caretBefore = attrib_sortPrice;
        sortNormalStyle();
        sortBy = 'price';
        if(caretBefore=='asc'){
            $(this).html('<i class="icon-caret-down"></i>');
            attrib_sortPrice = 'desc';
            sortTo = 'DESC';
        }else{
            $(this).html('<i class="icon-caret-up"></i>');
            attrib_sortPrice = 'asc';
            sortTo = 'ASC';
        }
    });
    function sortNormalStyle(){
        $("#sortAirline,#sortDepart,#sortPrice").html('<i class="icon-sort"></i>');
        attrib_sortAirline  = 'normal';
        attrib_sortDepart   = 'normal';
        attrib_sortPrice    = 'normal'; 
    }
    // .-->
    


    ///////////////////////////////////////////////
    /*   Fungsi untuk menghitung total halaman   */
    ///////////////////////////////////////////////
	function countPage(ndata, limit){
		return Math.ceil(parseInt(ndata)/parseInt(limit));
	}
    // .-->



    /////////////////////////////////////////////////////////////////////
    /*   Fungsi untuk link halaman 1,2,3 ... Next, Prev, First, Last   */
    /////////////////////////////////////////////////////////////////////
	function navPagination(curPage,nPage){
		var pagepage = '';
        var currentPage = parseInt(curPage);
        var countPage   = parseInt(nPage);

		// Link First
		if (currentPage > 1){
			pagepage += '<a href="javascript:;" onclick="gotoFirst()">First</a>';
		}

        // Link Previous
		if ((currentPage-1) > 0){
			previousval = currentPage-1;
			pagepage += '<a href="javascript:;" onclick="gotoPrevious(\''+previousval+'\')">Previous</a>';
		}

		// Link halaman 1,2,3, ...
        pagepage += '<span>';
		for (var i=1; i<=countPage; i++){
			if (i == currentPage){
				pagepage += '<a href="javascript:;" class="active">'+i+'</a>';
			}else{
				pagepage += '<a href="javascript:;" onclick="gotoPage(\''+i+'\')">'+i+'</a>';
			}
		}
        pagepage += '</span>';

		// Link Next 
		if (currentPage < countPage){
			nextval = currentPage+1;
			pagepage += '<a href="javascript:;" onclick="gotoNext(\''+nextval+'\')">Next</a>';
		}

        // Link Last
		if ((currentPage != countPage) && (countPage != 0)){
			pagepage += '<a href="javascript:;" onclick="gotoLast()">Last</a>';
		}
		return pagepage;
	}
    // .-->


    ///////////////////////////////////////////////
    /*   klik gotoFirst , halaman paling awal    */
    ///////////////////////////////////////////////
    window.gotoFirst = function(){
		startPage = 1; 
        progressData();
	}
    // .-->

    ///////////////////////////////////////////////
    /*   klik gotoPrevious , halaman sebelumnya  */
    ///////////////////////////////////////////////
    window.gotoPrevious = function(toPage){
		startPage = toPage; 
        progressData();
	}
    // .-->

    ///////////////////////////////////////////////
    /*  klik gotoPage , halaman yang di inginkan */
    ///////////////////////////////////////////////
    window.gotoPage = function(toPage){
        $("#tableAvail tbody").html('');
        $("#tableAvail tbody").append('<tr><td colspan="6"><div align="center"><img src="images/loadings.gif"></div></td></tr>');
        startPage = toPage; 
        progressData();
	}
    // .-->

    ///////////////////////////////////////////////
    /*    klik gotoNext , halaman berikutnya     */
    ///////////////////////////////////////////////
    window.gotoNext = function(toPage){
		startPage = toPage; 
        progressData();
	}
    // .-->

    ///////////////////////////////////////////////
    /*   klik gotoLast , halaman paling akhir    */
    ///////////////////////////////////////////////
    window.gotoLast = function(){
		startPage = PageX; 
        progressData();
	}
    // .-->
    

});