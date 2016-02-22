(function(){
    //common var
    var isMobile = /iPad|iPod|iPhone|Android/.test(navigator.userAgent),
        isWeixin = /MicroMessenger/.test(navigator.userAgent),
        $window = $(window);

    //vote var
    var winW = $window.width(),
        winH = $window.height(),
        theVoteTitle = '',
        theVoteDesc = '',
        loading = $('#loading'),
        btnStart = $('#start'),
        btnViewResult,
        wrapCover= $('#cover'),
        wrapContent = $('#content'),
        wrapEnd = $('#end'),
        btnPrevote = $('#preVote'),
        $voteStat = '',
        voteList,
        voteitem,
        voteResults,
        itemidStrUrl,
        voteNum;

    //firebase
    var myFirebaseRef = new Firebase('https://vote-on-firebase.firebaseio.com/');

    //cookie
    var voteCookie = {
        setCookie: function(name, value, exptime) {
            var now = new Date();
            var time = now.getTime();
            //var anhour = (exptime+8)*3600;//one hour Convert to Seconds
            var oneday = (exptime*24+8)*3600;//one day Convert to Seconds,+8 hours for china time zone
            time += oneday * 1000; //now millisecond + one day millisecond
            now.setTime(time);
            document.cookie = name+'='+value+';expires='+now.toUTCString();
        },
        getCookie: function (name){
            var cArr=document.cookie.split('; ');
            for(var i=0;i<cArr.length;i++){
                var cArr2=cArr[i].split('=');
                if(cArr2[0]==name){
                    return cArr2[1];
                }
            }
            return '';
        },
        removeCookie:function (name){
            voteCookie.setCookie(name, 1, -1);
        }
    }
    var voted = voteCookie.getCookie('voted');

    //html for pc/mobile
    if(isMobile){
        btnViewResult = $('#viewResult');
        voteList = $('#voteList');
        voteResults = $('#voteRlist');
        $voteStat = $('#voteStat');

        $('#mContainer').show().next().hide();

        //start button & view result button
        btnStart.on('click',function(event){
            event.preventDefault()
            wrapCover.fadeOut('fast',function(){
                wrapContent.show();
            });
        })

        btnViewResult.on('click',function(event){
            event.preventDefault()
            wrapCover.fadeOut('fast',function(){
                getResult();
                wrapEnd.show();
            });
        })
    }else{
        voteList = $('#pcVoteList');
        voteResults = $('#pcVoteRlist');
        $voteStat = $('#pcVoteStat');

        $('#mContainer').hide().next().show();
        $('body').addClass('pc');
        $('.btn-start').on('click', function(event) {
            event.preventDefault();
        });
    }


    //style for 单选/多选
    voteList.on('click', '.ops a', function(event) {
        event.preventDefault();
        var $optLi = $(this).parent();
        $optLi.toggleClass('active');
        $optLi.siblings().removeClass('active');
    });
    voteList.on('click', '.opm a', function(event) {
        event.preventDefault();
        var $optLi = $(this).parent();
        $optLi.toggleClass('active');
    });

    //render mobile vote html
    var getVoteList = function () {
        myFirebaseRef.child("questionlist").on("value", function(snapshot) {
            var qData = snapshot.val();
            var qList = qData,
                qSize = qData.length,
                optimgW = (winW-40)/2;

                //set pager count
                voteNum = qSize;
                $('#voteNum').text(voteNum);

                //render vote items
                for (var i = qSize - 1; i >= 0; i--) {
                    var qId = qList[i].questionid,
                        qTitle = qList[i].questionname,
                        qTitleImg = qList[i].imageurl,
                        isQtitleImg,
                        qTitleImgHtml,
                        qType = qList[i].type,
                        qTypeClass,
                        qTypeText,
                        qOpt = qList[i].options,
                        submitText;
                    if(qType==true){
                        qTypeClass = 'opm'
                        qTypeText = '<em>(可多选)</em>'
                    }else{
                        qTypeClass = 'ops'
                        qTypeText = ''
                    }
                    if (i==qSize-1){
                        submitText = "选好了，提交本次投票"
                    }else{
                        submitText = "选好了，下一题"
                    }
                    if (qTitleImg) {
                        qTitleImgHtml = '<p class="titleimg"><img src='+qTitleImg+' /></p>';
                        isQtitleImg = true;
                    }else{
                        qTitleImgHtml = '';
                        isQtitleImg = false;
                    };

                    //render votelist wrapper
                    $("<div class='voteitem' id='vi"+qId+"'><h2>"+qTitle+qTypeText+"</h2>"+qTitleImgHtml+"<ul id='"+qId+"' class='opitems "+qTypeClass+"'></ul><a href='#' class='submit-opt'>"+submitText+"</a></div>").prependTo(voteList);
                    //render vote options
                    var qOptImgArr = [],
                        qOptSize = qOpt.length;
                    for (var j = qOptSize - 1; j >= 0; j--) {
                        var qOptTitle = qOpt[j].itemname,
                            qOptImg = qOpt[j].imageurl,
                            isQoptImg,
                            qOptImgHtml,
                            qOptHtml,
                            qOptCount = +qOpt[j].countvote;

                        if (qOptImg) {
                            qOptImgHtml = "<img src="+qOptImg+" />";
                            qOptImgArr.push(qOptImg);
                        }else{
                            qOptImgHtml = "";
                        };

                        if(qOptImgArr.length){
                            qOptHtml = "<li id='voteOptId"+i+j+"'><a href='#'><div class='optimg'>"+qOptImgHtml+"</div><div class='textbar'>"+qOptTitle+"</div><span class='icon-opt'></span></a></li>";
                            $(qOptHtml).prependTo("#"+qId+"");
                            isQoptImg = true;
                        }else{
                            qOptHtml = "<li id='voteOptId"+i+j+"'><a href='#'><div class='optimg'></div><div class='textbar'><span class='icon-opt'></span><em>"+qOptTitle+"</em></div></a></li>";
                            $(qOptHtml).prependTo("#"+qId+"");
                            isQoptImg = false;
                        }

                        var imgModeA = isQtitleImg && !isQoptImg; //only Qtitle img
                        var imgModeB = isQoptImg; //Qoption img (include modeA)
                        if(imgModeA){
                            $('#vi'+qId+'').addClass('timode');
                        }
                        if(imgModeB){
                            $('#vi'+qId+'').addClass('oimode');
                            $('#voteOptId'+i+j+'').css({
                                width: optimgW
                            }).find('.optimg').css('height',optimgW);
                        }
                    }
                }

                voteitem = $('.voteitem');

                //loading hide
                loading.hide();
                shareInit();
                //show first voteitem/hide others
                voteitem.hide();
                voteitem.eq(0).show();
                //set last submit button
                voteitem.eq(qSize-1).find('.submit-opt').attr('id','submitVoteBtn')

                //set cookie
                setVoteCookie();

        });
    }

    //render PC vote html
    var getPcVoteList = function () {

        myFirebaseRef.child("questionlist").on("value", function(snapshot) {
            var qData = snapshot.val();
            var qList = qData,
                qSize = qData.length;

            //render vote items
            for (var i = qSize - 1; i >= 0; i--) {
                var qId = qList[i].questionid,
                    qTitle = qList[i].questionname,
                    qTitleImg = qList[i].imageurl,
                    isQtitleImg,
                    qTitleImgHtml,
                    qType = qList[i].type,
                    qTypeClass,
                    qTypeText,
                    qOpt = qList[i].options;
                if(qType==true){
                    qTypeClass = 'opm'
                    qTypeText = '<em> (可多选)</em>'
                }else{
                    qTypeClass = 'ops'
                    qTypeText = ''
                }

                if (qTitleImg) {
                    qTitleImgHtml = '<p class="titleimg"><img src='+qTitleImg+' /></p>';
                    isQtitleImg = true;
                }else{
                    qTitleImgHtml = '';
                    isQtitleImg = false;
                };

                //render votelist wrapper
                $("<div class='voteitem' id='vi"+qId+"'><h2>"+qTitle+qTypeText+"</h2>"+qTitleImgHtml+"<ul id='vi"+qId+"opts' class='opitems "+qTypeClass+"'></ul></div>").prependTo(voteList);
                //render vote options
                var qOptSize = qOpt.length
                    qOptImgArr = [];
                for (var j = qOptSize - 1; j >= 0; j--) {
                    var qOptTitle = qOpt[j].itemname,
                        qOptImg = qOpt[j].imageurl,
                        isQoptImg,
                        qOptImgHtml,
                        qOptCount = +qOpt[j].countvote;

                    /*if (qOptImg) {
                        qOptImgHtml = '<img src='+qOptImg+' />';
                        qOptImgArr.push(qOptImg);
                    }else{
                        qOptImgHtml = '';
                    };

                    $("<li id='vopt"+i+j+"'><a href='#'><div class='optimg'>"+qOptImgHtml+"</div><div class='textbar'><span class='icon-opt'></span><em>"+qOptTitle+"</em></div></a></li>").prependTo("#vi"+qId+"opts");*/


                    if (qOptImg) {
                        qOptImgHtml = "<img src="+qOptImg+" />";
                        qOptImgArr.push(qOptImg);
                    }else{
                        qOptImgHtml = "";
                    };

                    if(qOptImgArr.length){
                        qOptHtml = "<li id='vopt"+i+j+"'><a href='#'><div class='optimg'>"+qOptImgHtml+"</div><div class='textbar'><span class='icon-opt'></span><em>"+qOptTitle+"</em></div></a></li>";
                        $(qOptHtml).prependTo("#vi"+qId+"opts");
                        isQoptImg = true;
                    }else{
                        qOptHtml = "<li id='vopt"+i+j+"'><a href='#'><div class='textbar'><span class='icon-opt'></span><em>"+qOptTitle+"</em></div></a></li>";
                        $(qOptHtml).prependTo("#vi"+qId+"opts");
                        isQoptImg = false;
                    }
                }
                //console.log(qOptImgArr.length);
                if(qOptImgArr.length){
                    isQoptImg = true;
                }else{
                    isQoptImg = false;
                }
                var imgModeA = isQtitleImg && !isQoptImg; //only Qtitle img
                var imgModeB = isQoptImg; //Qoption img (include modeA)
                if(imgModeA){
                    $('#vi'+qId+'').addClass('timode');
                }
                if(imgModeB){
                    $('#vi'+qId+'').addClass('oimode');
                }
            }

            voteitem = $('.voteitem');

            //loading hide
            loading.hide();

            //set cookie
            setVoteCookie();

            /*$('#delCookie').on('click', function(event) {
                event.preventDefault();
                voteCookie.removeCookie('itemid');
            });*/
        })
    }

    var getResult = function () {
        //vote all count
        myFirebaseRef.child("votetimes").on("value", function(snapshot) {
            $voteStat.text(snapshot.val());
        });
        myFirebaseRef.child("questionlist").on("value", function(snapshot) {
            var qData = snapshot.val();
            var rList = qData,
                rSize = qData.length;

            var theDataArr = [];

            //render vote items
            for (var i = rSize - 1; i >= 0; i--) {
                var rId = rList[i].questionid,
                    rTitle = rList[i].questionname,
                    rTitleImg = rList[i].imageurl,
                    rTitleImgHtml,
                    rOpt = rList[i].options;

                if (rTitleImg) {
                    rTitleImgHtml = '<img src='+rTitleImg+' />';
                    isRtitleImg = true;
                }else{
                    rTitleImgHtml = '';
                    isRtitleImg = false;
                };

                //render vote results wrapper
                $("<div class='voteri' id='vri"+rId+"'><h2>"+rTitle+"</h2><div class='rtimg'>"+rTitleImgHtml+"</div><ul id='voteResults"+rId+"'></ul><div class='vrpc' id='vrpc"+rId+"'></div></div>").prependTo(voteResults);

                //render vote items & vote results html
                var rOptSize = rOpt.length;
                var totalCount = 0;
                var riArr = [];

                //render vote count
                for (var rti = rOptSize - 1; rti >= 0; rti--) {
                    var rOptCount = +rOpt[rti].countvote;
                    riArr.push(rOptCount);
                    totalCount += rOptCount;
                }
                theDataArr.push(riArr);

                var rOptImgArr = [];
                //render vote items
                for (var j = rOptSize - 1; j >= 0; j--) {
                    var rOptTitle = rOpt[j].itemname,
                        rOptImg = rOpt[j].imageurl,
                        rOptImgHtml,
                        rOptCount = +rOpt[j].countvote;

                    if (rOptImg) {
                        rOptImgHtml = '<img src='+rOptImg+' />';
                        rOptImgArr.push(rOptImg);
                    }else{
                        rOptImgHtml = '';
                    };

                    if(rOptImgArr.length){
                        isRoptImg = true;
                    }else{
                        isRoptImg = false;
                    }
                    var imgModeA = isRtitleImg && !isRoptImg; //only Qtitle img
                    var imgModeB = isRoptImg; //Qoption img (include modeA)
                    if(imgModeA){
                        $('#vri'+rId+'').addClass('timode');
                    }
                    if(imgModeB){
                        $('#vri'+rId+'').addClass('oimode');
                    }

                    var theVotePer = Math.round(rOptCount/totalCount*100)+'%';

                    //render vote results items
                    $("<li id='optr"+i+j+"'><div class='roptimg'>"+rOptImgHtml+"</div><div class='roptchart'><h3>"+rOptTitle+"</h3><div class='bar'><div class='inner' data-wper='"+theVotePer+"'><em id='barper"+i+j+"'>"+theVotePer+"</em></div></div></div></li>").prependTo("#voteResults"+rId+"");

                }
            }
            var endHeight = $('.vote-results').height()+$('.sharewrap').height()+$('.topbar').eq(1).height() +120;

            if(isMobile){
                $('#mContainer').height(endHeight);
            }

            $('.bar').each(function() {
                var $this = $(this),
                    theWidth = $this.find('.inner').data('wper');
                $this.find('.inner').animate({
                    width:theWidth
                }, 1000)
            });
        })
    }

    var submitVote = function () {
        //总投票数
        var upvotesRef = new Firebase('https://vote-on-firebase.firebaseio.com/votetimes/');
        upvotesRef.transaction(function (current_value) {
          return (current_value || 0) - 0 + 1;
        });
        //console.log(itemidStrUrl);
        //各选项投票数
        for (var i = 0; i < itemidStrUrl.length; i++) {
            var upVoteCount = new Firebase('https://vote-on-firebase.firebaseio.com/questionlist/'+i+'/options/'+itemidStrUrl[i]+'/countvote/');
            /*upVoteCount.child("countvote").on("value", function(snapshot) {
                console.log(snapshot.val());
            });*/
            upVoteCount.transaction(function (current_value) {
              return (current_value || 0)-0 + 1;
            });
        }

        //render result html
        getResult();
    }

    //pager
    var setVoteCookie = function () {
        var itemids = [],
            optimg = $('.optimg').find('img');

        function optimgTop() {
            optimg.each(function(index, el) {
                var $this = $(this),
                    optimgBoxH = $this.parent().height();
                    optimgH = $this.height();
                $this.css('margin-top',(optimgBoxH-optimgH)/2);
            });
        }
        //submit button
        voteList.on('click', '.submit-opt', function(event) {
            event.preventDefault();
            var $this = $(this),
                isSubmitBtn = $this.attr('id'),
                vindex = $('#voteIndex').text(),
                theItems;

            if(isMobile){
                theItems = $this.prev().find('.active');
                if(!theItems.length){
                    alert('您没有选中任何选项！');
                }else{
                    //show next vote item
                    $this.parent().hide('fast', function() {
                        optimgTop();
                    });//current vote hide
                    $this.parent().next().fadeIn('fast');//next vote show
                    //voteIndex
                    vindex++;
                    if(vindex<=voteNum){
                        $('#voteIndex').text(vindex);
                    }
                    if(vindex>1){
                        btnPrevote.show();
                    }
                    //set cookie
                   theItems.each(function(index, el) {
                        var $this = $(this);
                        itemids.push($this.index());
                    });
                    itemidStrUrl = itemids;

                    if(isSubmitBtn=='submitVoteBtn'){
                        wrapContent.fadeOut('fast',function(){
                            submitVote();
                            wrapEnd.show();
                            //set cookie
                            voteCookie.setCookie('voted', 'yes', 1);
                        });
                    }
                }
            }else{
                var theItemArr = [],
                    selectedAll;
                for (var i = voteitem.length - 1; i >= 0; i--) {
                    theItemArr.push(voteitem.eq(i).find('.active').length);
                };

                for (var i = theItemArr.length - 1; i >= 0; i--) {
                    if(!theItemArr[i]){
                        selectedAll = false;
                        break;
                    }else{
                        selectedAll = true;
                    }
                };

                theItems = $('#pcVoteList').find('.active');
                //console.log(theItemArr, theItems,selectedAll);
                if(!selectedAll){
                    alert('每题须至少选中一个选项！');
                }else{
                    theItems.each(function(index, el) {
                        var $this = $(this);
                        itemids.push($this.index());
                    });
                    itemidStrUrl = itemids;

                    $('#pcVoteList').fadeOut('fast',function(){
                        submitVote();
                        $this.parent().prev().show();
                        $('.voteresults-wrap').fadeIn();
                        //set cookie
                        voteCookie.setCookie('voted', 'yes', 1);
                    });
                }
            }

        });
        //prev link
        btnPrevote.on('click', function(event) {
            event.preventDefault();
            var cvIndex = $('#voteIndex').text();
            cvIndex--;
            if(cvIndex>=1){
                $('#voteIndex').text(cvIndex);
                voteitem.eq(cvIndex-1).fadeIn();
                voteitem.eq(cvIndex-1).siblings().hide();
            }
            if(cvIndex==1){
                $(this).hide();
            }
            optimgTop();
        });
    }

    //share
    var $shareWrap =  $('.sharewrap');
    var shareInit = function () {
        // weixin share
        if(isWeixin){
            $shareWrap.show();
        }

        $('#showSharetip').on('click', function(){
            $(this).fadeIn('fast');
        });
        $('.overlay-wxshare').on('click',function(){
            $(this).fadeOut('fast',function(){$(this).remove();});
        });
    }

    //voted
    if (voted){

        //Get & render vote name & desc in cover & head title
        myFirebaseRef.child("pro_name").on("value", function(snapshot) {
            theVoteTitle = snapshot.val();
            $('#coverTitle, #pcCoverTitle').text(theVoteTitle);
            //html title
            document.getElementsByTagName("title")[0].innerHTML=theVoteTitle;
        });
        myFirebaseRef.child("pro_desc").on("value", function(snapshot) {
            theVoteDesc = snapshot.val();
            $('#coverDesc,#pcCoverDesc').text(theVoteDesc);
        });


        loading.hide();
        if(isMobile){
            btnStart.hide();
            btnViewResult.show();
        }else{
            voteList.hide();
            getResult();
            $('.voteresults-wrap').show();
        }
    }else{
        $('.voteresults-wrap').hide();

        //Get & render vote name & desc in cover & head title
        myFirebaseRef.child("pro_name").on("value", function(snapshot) {
            theVoteTitle = snapshot.val();
            $('#coverTitle, #pcCoverTitle').text(theVoteTitle);
            //html title
            document.getElementsByTagName("title")[0].innerHTML=theVoteTitle;
        });
        myFirebaseRef.child("pro_desc").on("value", function(snapshot) {
            theVoteDesc = snapshot.val();
            $('#coverDesc,#pcCoverDesc').text(theVoteDesc);
        });

        if(isMobile){
            getVoteList();
        }else{
            getPcVoteList();
            $('.btn-start').parent().hide();
        }
    }

})();