// ==UserScript==
// @name         ShareAllianceBUND
// @version      1.12.0
// @description  teilt Einsätze im Verband und postet eine Rückmeldung im Chat - Dieses Script ist exklusiv für den Verband Bundesweiter KatSchutz (Bund)
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/missions/*
// @grant        none
// @require      https://drtraxx.github.io/js/apis.1.0.1.js
// ==/UserScript==
/* global $ */

(async function() {
    'use strict';

    if(!localStorage.sab_preferences) localStorage.sab_preferences = JSON.stringify({"jumpNext":false,"showCredits":false,"optionalText":{"bol":false,"value":""},"shortKey":89,"pushPatients":false,"showDate":false,"allianceChat":false});
    if(sessionStorage.sabReturnAlert){
        $('#mission_general_info').parent().after(sessionStorage.sabReturnAlert);
        sessionStorage.removeItem('sabReturnAlert');
    }

    var aMissions = await getMissions();
    var missionId = window.location.pathname.replace(/\D+/g,'');
    var missionAddress = $('#mission_general_info').children('small').text().split('|')[0].trim();

    function pushPgsl() {
        $('#mission_finish_now_btn')
            .parent()
            .after(`<a class="btn btn-success" id="sabPushPgsl" title="PGSL-Rückmeldung pushen">PGSL Rückmeldung</a>
                    <select id="sabSelRules" class="custom-select" style="width:15em">
                      <option value="noRules" selected>Reglementierung wählen</option>
                      <option value="noELW">keine Einsatzleitung</option>
                    </select>`);
    }

    if(!$('#mission_help').attr('href')) {
        if($("#col_left .alert-info").length == 0) {
            pushPgsl();
        } else {
            return false;
        }
    }

    var config = JSON.parse(localStorage.sab_preferences);
    var missionIdNextMission = $('#mission_next_mission_btn').attr('href').replace(/\D+/g,'');
    var missionTypeId = $('#mission_help').attr('href').split("/").pop().replace(/\?.*/, '');
    var mission = aMissions.filter((obj) => obj.id == missionTypeId)[0];
    var credits = mission.additional.guard_mission ? parseInt($("#col_left").text().match(/(?:Verdienst:)\s([\d.]+)/g)[0].replace(/\D+/g,'')) : mission.average_credits;
    var patients = $('.mission_patient').length;
    var missionDate = $("#missionH1").attr("data-original-title").replace("Einsatz eingegangen: ","");

    if(!$('#mission_alliance_share_btn').attr('href')) {
        if(mission.additional.only_alliance_mission === true && $("#col_left .alert-info").length == 0) {
            pushPgsl();
        } else {
            return false;
        }
    }

    if(credits < 2500 && !mission.additional.guard_mission) return false;

    $('#mission_finish_now_btn')
        .parent()
        .after(`<div class="btn-group dropup">
                  <a class="btn btn-success btn-sm" id="shareBund" title="Alarmieren, im Verband freigeben und eine Rückmeldung mit der Adresse in den Chat senden." style="height:32px">
                    <img class="icon icons8-Phone-Filled" src="/images/icons8-phone_filled.svg" width="16" height="16">
                    <img class="icon icons8-Share" src="/images/icons8-share.svg" width="16" height="16">
                    <span class="glyphicon glyphicon-info-sign"></span>
                    <span class="glyphicon glyphicon-arrow-right" id="jumpArrow" style="display:${config.jumpNext ? `inline` : `none`}"></span>
                 </a>
                  <button type="button" class="btn btn-success btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="height:32px" id="btnSabOptions">
                    <div class="glyphicon glyphicon-cog" style="color:LightSteelBlue"></div>
                  </button>
                  <div class="dropdown-menu">
                    <div class="dropdown-item form-check">
                      <input type="checkbox" class="form-check-input" id="cbxJumpNext" ${config.jumpNext ? `checked`: ``}>
                      <label class="form-check-label" for="cbxJumpNext" title="zum nächsten Einsatz springen">nächster Einsatz</label>
                    </div>
                    <div class="dropdown-item form-check">
                      <input type="checkbox" class="form-check-input" id="cbxShowCredits" ${config.showCredits ? `checked`: ``}>
                      <label class="form-check-label" for="cbxShowCredits" title="Durchschn. Verdienst in die Rückmeldung schreiben">zeige Verdienst</label>
                    </div>
                    <div class="dropdown-item form-check">
                      <input type="checkbox" class="form-check-input" id="cbxPushPatients" ${config.pushPatients ? `checked`: ``}>
                      <label class="form-check-label" for="cbxPushPatients" title="Anzahl Patienten an EST in die Rückmeldung schreiben">zeige Patienten</label>
                    </div>
                    <div class="dropdown-item form-check">
                      <input type="checkbox" class="form-check-input" id="cbxDate" ${config.showDate ? `checked`: ``}>
                      <label class="form-check-label" for="cbxOptionalText" title="Einsatzdatum in die Rückmeldung schreiben">zeige Einsatzdatum</label>
                    </div>
                    <div class="dropdown-item form-check">
                      <input type="checkbox" class="form-check-input" id="cbxAllianceChat" ${config.allianceChat ? `checked`: ``}>
                      <label class="form-check-label" for="cbxAllianceChat" title="Rückmeldung in den Chat senden">im Verbandchat pushen</label>
                    </div>
                    <div class="dropdown-item form-check">
                      <input type="checkbox" class="form-check-input" id="cbxOptionalText" ${config.optionalText.bol ? `checked`: ``}>
                      <label class="form-check-label" for="cbxOptionalText" title="zusätzliche Rückmeldung abgeben. (z.B. dringend benötigte Fahrzeuge)">zus. Rückmeldung</label>
                    </div>
                    <div class="dropdown-item input-group">
                      <input type="text" class="form-control form-control-sm" value="${config.optionalText.value}" placeholder="zusätzliche Rückmeldung" id="iptConfigOptionalText" title="zusätzliche Rückmeldung" style="width:20em;height:22px">
                    </div>
                    <div class="dropdown-item input-group btn-group">
                      <input type="text" class="form-control form-control-sm" value="${config.shortKey}" id="iptShortKey" title="Strg (Mac: control) + Shift + key" style="width:4em;height:22px">
                      <a class="btn btn-info btn-xs" href="https://keycode.info/" target="_blank" title="Short-Key suchen">Short-Key</a>
                    </div>
                    <div class="dropdown-item btn-group">
                      <a class="btn btn-success btn-xs" id="sabSavePreferences">Speichern</a>
                    </div>
                  </div>
                  <input class="form-control form-control-sm" type="text" placeholder="zusätzliche Rückmeldung" value="${config.optionalText.value ? config.optionalText.value : ``}" id="iptOptionalText" style="height:32px;width:20em;display:${config.optionalText.bol ? `inherit` : `none`}">
                </div>`);

    async function alarmAndShare(){

        var checkedVehicles = [];
        var postValue = config.showDate ? "eingegangen: " + missionDate + "; " + missionAddress : missionAddress;
        var alertMission = "";
        var checkMessage = credits >= 5000 ? 1 : 0;

        if(config.showCredits) postValue += mission.additional.guard_mission ? "; " + credits.toLocaleString() + " Credits" : "; ca. " + credits.toLocaleString() + " Credits";
        if(patients > 0 && config.pushPatients) postValue += patients == 1 ? "; " + patients + " Patient" : "; " + patients + " Patienten";
        if(config.optionalText.bol && $('#iptOptionalText').val()){
            postValue += " => " + $('#iptOptionalText').val();
        }

        $('.vehicle_checkbox').each(function(){
            if($(this)[0].checked){
                checkedVehicles.push($(this).attr('value'));
            }
        });

        if(!config.allianceChat) checkMessage = 0;

        if(checkedVehicles.length > 0) {
            $("#shareBund").text("Alarmieren ...");
            await $.post('/missions/' + missionId + '/alarm', {'vehicle_ids' : checkedVehicles}, function(data) {
                if($('.alert-success ', data).length) {
                    alertMission = $('.alert-success ', data)[0].outerHTML.replace('</div>','');
                } else {
                    alertMission+= "<div class='alert fade in alert-success '>" + checkedVehicles.length.toLocaleString() + " Fahrzeuge wurden erfolgreich alarmiert.";
                }
            });
        }

        $("#shareBund").text("Teilen ...");
        await $.post('/missions/' + missionId + '/alliance', function(data) {
            if(checkedVehicles.length > 0) {
                    alertMission += "<br>Einsatz wurde erfolgreich freigegeben.";
            } else {
                alertMission = "<div class='alert fade in alert-success '>Einsatz wurde erfolgreich freigegeben.";
            }
        });

        $("#shareBund").text("Posten ...");
        await $.post("/mission_replies", {"mission_reply": {"alliance_chat" : checkMessage, "content" : postValue, "mission_id" : missionId}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")}, function(data) {
            alertMission += " Deine Rückmeldung wurde gespeichert.</div>";
            sessionStorage.sabReturnAlert = alertMission;
            config.jumpNext && missionIdNextMission ? window.location.replace('/missions/' + missionIdNextMission) : window.location.reload();
        });
    }

    $("body").on("click", "#shareBund", function(){
        alarmAndShare();
    });

    //triggert die function mit Strg + Shift + key
    $("body").keydown(function(e) {
        if(e.ctrlKey && e.shiftKey && e.which == $('#iptShortKey').val()) {
            alarmAndShare();
            return false;
        }
    });

    $("body").on("click", "#cbxJumpNext", function(){
        config.jumpNext = $('#cbxJumpNext')[0].checked;
        if(!config.jumpNext){
            $('#jumpArrow').css({"display":"none"});
        } else {
            $('#jumpArrow').css({"display":"inline"});
        }
    });

    $("body").on("click", "#cbxShowCredits", function(){
        config.showCredits = $('#cbxShowCredits')[0].checked;
    });

    $("body").on("click", "#cbxPushPatients", function(){
        config.pushPatients = $('#cbxPushPatients')[0].checked;
    });

    $("body").on("click", "#cbxAllianceChat", function(){
        config.allianceChat = $('#cbxAllianceChat')[0].checked;
    });

    $("body").on("click", "#cbxDate", function(){
        config.showDate = $('#cbxDate')[0].checked;
    });

    $("body").on("click", "#cbxOptionalText", function(){
        config.optionalText.bol = $('#cbxOptionalText')[0].checked;
        if(!config.optionalText.bol){
            $('#iptOptionalText').css({"display":"none"});
        } else {
            $('#iptOptionalText').css({"display":"inherit"});
            $("#iptOptionalText").val(config.optionalText.value ? config.optionalText.value : $("#iptConfigOptionalText").val());
        }
    });

    $("body").on("click", "#sabSavePreferences", function(){
        if(isNaN(parseInt($('#iptShortKey').val()))) {
            alert("Bitte ShortKey als Ganzzahl angeben.");
            return false;
        }
        config.optionalText.value = $("#iptConfigOptionalText").val();
        config.shortKey = parseInt($('#iptShortKey').val());
        localStorage.sab_preferences = JSON.stringify(config);
        $('#mission_general_info')
            .parent()
            .after(`<div class="alert fade in alert-success "><button class="close" data-dismiss="alert" type="button">×</button>Die Einstellungen wurden gespeichert.</div>`);
    });

    $("body").on("click", "#sabPushPgsl", async function() {
        var pushContent = "PGSL - " + missionAddress;

        switch($("#sabSelRules").val()) {
            case "noRules":
                break;
            case "noELW":
                pushContent += " - keine ELW1, ELW2 oder AB-Einsatzleitung! Nichtbeachtung führt zur Meldung an die Administration."
                break;
        }

        await $.post("/mission_replies", {"mission_reply": {"alliance_chat" : 1, "content" : pushContent, "mission_id" : missionId}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")}, function(data) {
            sessionStorage.sabReturnAlert = "<div class='alert fade in alert-success '>Deine Rückmeldung wurde gespeichert.</div>";
        });

        window.location.reload();
    });

})();
