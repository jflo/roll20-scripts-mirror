on('chat:message', function (msg) {
    /**
     * The GlitchCatcher is an API script that when added, will do its best
     * to catch Shadowrun glitches. In Shadowrun, any pooled roll which contains
     * more than half 1s is considered a glitch. In addition, if there are also
     * no hits on the roll, it is considered a critical glitch. When detected
     * glitches will be reported in the chat window.
     * 
     * The script does its best to avoid non-pooled rolls, but isn't
     * bulletproof. For instance, it avoids initiative rolls generated by any
     * character sheet roll template that starts with 'sr' and have whos content
     * contains the string 'Initiative'.
     * 
     * 
     * 
     */
     
    if((msg.type == 'general' && (msg.rolltemplate.indexOf('sr') == 0)) || msg.type == 'rollresult') { //todo JSON.parse(msg.content) to get the rollresult obj
        if(msg.content.indexOf('Initiative') >= 0) {
            return; //not a pooled roll, don't report glitches
        }
        if(msg.type == 'rollresult') {
            var rollResult = JSON.parse(msg.content);
            var poolSize = rollResult.rolls[0].dice;
            var dice = rollResult.rolls[0].results;
        } else {
            var poolSize = msg.inlinerolls[1].results.rolls[0].dice;
            var dice = msg.inlinerolls[1].results.rolls[0].results;
        }
        
        
        var oneCount = 0;
        var hitCount = 0;
        var i = 0;
        var r;
        
        
        for(i=0; i<dice.length; i++) {
            if(dice[i].v == 1) {
                oneCount++;
            }
            if(dice[i].v == 5 || dice[i].v == 6) {
                hitCount++;
            }
        }
        log(msg.who + " rolled " + oneCount +" out of " + poolSize);
        if(oneCount > poolSize/2 && hitCount == 0) {
            log(msg.who + " critically glitched");
            sendChat("player|"+msg.playerid, "/direct <big><strong>CRIT GLITCH!</strong></big>");
        } else if(oneCount > poolSize/2){
            log(msg.who + " glitched");
            sendChat("player|"+msg.playerid, "/direct <big><strong>GLITCH!</strong></big>");
        }
    }
    
});

/**
 * SRInitiativeTracker will handle any iniative rolls which come from the SR5
 * character sheet roll templates. The character being "spoken as" will have
 * their token added to the initiative tracker in sorted order.
 * 
 * This script also provides a '!nextpass' chat command which will automatically
 * subtract 10 from all entries and remove those which have no initiative left.
 * 
 */
 
on('chat:message', function(msg) {
    if(msg.type == 'general' && (msg.rolltemplate.indexOf('sr') == 0) && (msg.content.indexOf('Initiative') > -1)) {
        //script should only respond to template rolls from sr which have 'Initiative' in them somewhere
        
        var initScore = msg.inlinerolls[1].results.total;
        var turnorder;
        var player = getObj("player", msg.playerid);
        //log(player);
        var charId = player.get("speakingas");
        //log(charId);
        charId = charId.slice(charId.indexOf('|')+1);
        //log(charId);
        var character = getObj("character", charId);
        var token = findObjs({_type:"graphic",represents:charId});
        //log(token[0]);
        //log(character);
        if(Campaign().get("turnorder") == "") {
            turnorder = []; 
        } else {
            turnorder = JSON.parse(Campaign().get("turnorder"));
        }

    //Add a new custom entry to the end of the turn order.
        turnorder.push({
            id: token[0].get("_id"),
            pr: initScore
            //custom: character.get("name")
        });
        turnorder.sort(function(a, b) { return b.pr-a.pr; }); //what about ties? ERI
        Campaign().set("turnorder", JSON.stringify(turnorder));
    }
});

on('chat:message', function(msg) {
    if(msg.content == '!nextpass') {

        if(Campaign().get("turnorder") == "") {
            turnorder = []; 
        } else {
            turnorder = JSON.parse(Campaign().get("turnorder"));
        }

        nextPassOrder = [];
        //foreach obj in turnorder
        for(i = 0; i < turnorder.length; i++) {
            //if pr < 10 remove from []
            //otherwise pr = pr-10
            //log("Turn "+i+" "+turnorder[i]);
            if(turnorder[i].pr > 10) {
                turnorder[i].pr = turnorder[i].pr - 10;
                nextPassOrder.push(turnorder[i]);
            }
        }
        nextPassOrder.sort(function(a, b) { return b.pr-a.pr; });
        //sort array desc
        Campaign().set("turnorder", JSON.stringify(nextPassOrder));   
    }

});