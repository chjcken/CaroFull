var webSocket;
var isWebSocketSupported = window.WebSocket;


var iLastUserMove=0;
var jLastUserMove=0;


var myTurn=false;


var playWithCom = true;

var FIND_OPPONENT = "FIND";
var STOP_FINDING_OPPONENT = "STOPFINDING";
var OPPONENT_FOUND_YOU_GO_FIRST = "YOUGOFIRST";
var OPPONENT_FOUND_YOU_GO_SECOND = "YOUGOSECOND";
var PLAY_MOVE = "MOVE_";
var SURRENDER = "surrender";
var ERROR = "ERROR!";
var CHAT = "CHAT_";





var SIZE = [15, 15]; // so o chieu ngang, chieu doc

var END = false;

var X = true;
var signal = new Array();
signal[X] = "<img src='img/x.png'>";
signal[!X] = "<img src='img/o.png'>";



SELF_MOVE= 1;
OPPENENT_MOVE=-1;
BLANK="b-1";
winningMove=9999999;
openFour   =8888888;
twoThrees  =7777777;

function setPlayWithCom(val){
	playWithCom = val;
	document.getElementById("chattext").innerHTML = "";
	if (playWithCom){
		
		$("#playcom").addClass("glyphicon glyphicon-pushpin");
		$("#playother").removeClass();
		// if (webSocket != undefined)
		// 	webSocket.close();									

		$("#modalPlay").modal("show");
		resetGame();

	}

	else{
		if (!isWebSocketSupported){
			alert("Your browser does not support web socket!");
			return;
		}

		$("#find").show();
		$("#stopfind").show();

		$("#playother").addClass("glyphicon glyphicon-pushpin");
		$("#playcom").removeClass();
		resetGame();									
		
		setTimeout("findOpponent(true);", 500);
	}								
	
}



f=new Array();
s=new Array();
q=new Array();
for (i=0;i<SIZE[0];i++) {
 f[i]=new Array();
 s[i]=new Array();
 q[i]=new Array();
 for (j=0;j<SIZE[1];j++) {
  f[i][j]=0;
  s[i][j]=0;
  q[i][j]=0;
 }
}


function resetGame() {
	for (i=0;i<SIZE[0];i++) {
	  for (j=0;j<SIZE[1];j++) {
	   if (f[i][j] != 0){
		   var cell = document.getElementById("cell"+i+j);
		   //if (cell != null)
		   	cell.innerHTML = "";
	   }

	   	f[i][j]=0;
	  }
	}
	myTurn = true;
	if (!playWithCom){
		if (isWebSocketSupported){
			openSocket();
			myTurn = false;
		}
		else {
			alert("Your browser does not support web socket!");
		}
	}
	else {									
		showMessage("NEW GAME -- YOU GO FIRST!!", "System");
	}
	$("#btnNewgame").hide();


}


function drawBoard() {
	var i, j;
	sBoard = "<table class='table table-bordered'>";
	for (i = 0; i < SIZE[0]; i++) {
		sBoard += "<tr>";
		for (j = 0; j < SIZE[1]; j++) {
			sBoard += "<td class=cell id='cell" +i+j+"' cell='" + i + "," + j + "' onclick='cellClick(" + i + "," + j + ");'>&nbsp;</td>";
		}
		sBoard += "</tr>";
	}
	sBoard += "</table>";
	document.write(sBoard);
}

function cellClick(i, j){
	if(!myTurn || f[i][j]!=0) return;

	drawMovedCell(i, j, SELF_MOVE);

	
	myTurn = !myTurn;
	iLastUserMove=i;
	jLastUserMove=j;

	f[i][j] = SELF_MOVE;
	
	var isWin = (winningPos(i,j,SELF_MOVE)==winningMove);
	
	if (isWin){
		setTimeout("alert('You win!');",200);
		$("#btnNewgame").show();
	}
	
	
	if (playWithCom && !isWin){
		machineMove(iLastUserMove,jLastUserMove);
	}
	else {
		webSocket.send(PLAY_MOVE + i + "_" + j);
	}
	
}

function drawMovedCell(i, j, role){
	var cell = document.getElementById("cell"+i+j);

	if(role == SELF_MOVE)
		cell.innerHTML = signal[X];
	else if (role == OPPENENT_MOVE)
		cell.innerHTML = signal[!X];
	else {
		cell.innerHTML = "";
	}
}

function drawAndHighlightOpponentMove(iMach, jMach){
	drawMovedCell(iMach,jMach,OPPENENT_MOVE);
	setTimeout("drawMovedCell(iMach,jMach,BLANK);", 200);
	setTimeout("drawMovedCell(iMach,jMach,OPPENENT_MOVE);", 400);
	setTimeout("drawMovedCell(iMach,jMach,BLANK);", 600);
	setTimeout("drawMovedCell(iMach,jMach,OPPENENT_MOVE);", 800);
}
	

	function machineMove(iUser,jUser) {
	 maxS=evaluatePos(s,SELF_MOVE);
	 maxQ=evaluatePos(q,OPPENENT_MOVE);

	 // alert ('maxS='+maxS+', maxQ='+maxQ);

	 if (maxQ>=maxS) {
	  maxS=-1;
	  for (i=0;i<SIZE[0];i++) {
	   for (j=0;j<SIZE[1];j++) {
	    if (q[i][j]==maxQ && s[i][j]>maxS) {
	     maxS=s[i][j]; 
	     iMach=i;
	     jMach=j;
	    }
	   }
	  }
	 }

	 else {
	  maxQ=-1;
	  for (i=0;i<SIZE[0];i++) {
	   for (j=0;j<SIZE[1];j++) {
	    if (s[i][j]==maxS && q[i][j]>maxQ) {
	     maxQ=q[i][j]; 
	     iMach=i;
	     jMach=j;
	    }
	   }
	  }
	 }

	 f[iMach][jMach]=OPPENENT_MOVE;
	 
	 drawAndHighlightOpponentMove(iMach, jMach);
	 
	 if (winningPos(iMach,jMach,OPPENENT_MOVE)==winningMove){ 
		 setTimeout("alert('You loose!')",200);
		 $("#btnNewgame").show();
		 return;
	 }
	 
	 setTimeout("myTurn=!myTurn;",850);
	}

	function hasNeighbors(i,j) {
	 if (j>0 && f[i][j-1]!=0) return 1;
	 if (j+1<SIZE[1] && f[i][j+1]!=0) return 1; 
	 if (i>0) {
	  if (f[i-1][j]!=0) return 1;
	  if (j>0 && f[i-1][j-1]!=0) return 1;
	  if (j+1<SIZE[1] && f[i-1][j+1]!=0) return 1;
	 }
	 if (i+1<SIZE[0]) {
	  if (f[i+1][j]!=0) return 1;
	  if (j>0 && f[i+1][j-1]!=0) return 1;
	  if (j+1<SIZE[1] && f[i+1][j+1]!=0) return 1;
	 }
	 return 0;
	}

	w=new Array(0,20,17,15.4,14,10);
	nPos=new Array();
	dirA=new Array();


	function winningPos(i,j,mySq) {
	 test3=0;

	 L=1;
	 m=1; while (j+m<SIZE[1]  && f[i][j+m]==mySq) {L++; m++} m1=m;
	 m=1; while (j-m>=0 && f[i][j-m]==mySq) {L++; m++} m2=m;   
	 if (L>4) { return winningMove; }
	 side1=(j+m1<SIZE[1] && f[i][j+m1]==0);
	 side2=(j-m2>=0 && f[i][j-m2]==0);

	 if (L==4 && (side1 || side2)) test3++;
	 if (side1 && side2) {
	  if (L==4) return openFour;
	  if (L==3) test3++;
	 }

	 L=1;
	 m=1; while (i+m<SIZE[0]  && f[i+m][j]==mySq) {L++; m++} m1=m;
	 m=1; while (i-m>=0 && f[i-m][j]==mySq) {L++; m++} m2=m;   
	 if (L>4) { return winningMove; }
	 side1=(i+m1<SIZE[0] && f[i+m1][j]==0);
	 side2=(i-m2>=0 && f[i-m2][j]==0);
	 if (L==4 && (side1 || side2)) test3++;
	 if (side1 && side2) {
	  if (L==4) return openFour;
	  if (L==3) test3++;
	 }
	 if (test3==2) return twoThrees;

	 L=1;
	 m=1; while (i+m<SIZE[0] && j+m<SIZE[1] && f[i+m][j+m]==mySq) {L++; m++} m1=m;
	 m=1; while (i-m>=0 && j-m>=0 && f[i-m][j-m]==mySq) {L++; m++} m2=m;   
	 if (L>4) { return winningMove; }
	 side1=(i+m1<SIZE[0] && j+m1<SIZE[1] && f[i+m1][j+m1]==0);
	 side2=(i-m2>=0 && j-m2>=0 && f[i-m2][j-m2]==0);
	 if (L==4 && (side1 || side2)) test3++;
	 if (side1 && side2) {
	  if (L==4) return openFour;
	  if (L==3) test3++;
	 }
	 if (test3==2) return twoThrees;

	 L=1;
	 m=1; while (i+m<SIZE[0]  && j-m>=0 && f[i+m][j-m]==mySq) {L++; m++} m1=m;
	 m=1; while (i-m>=0 && j+m<SIZE[1] && f[i-m][j+m]==mySq) {L++; m++} m2=m; 
	 if (L>4) { return winningMove; }
	 side1=(i+m1<SIZE[0] && j-m1>=0 && f[i+m1][j-m1]==0);
	 side2=(i-m2>=0 && j+m2<SIZE[1] && f[i-m2][j+m2]==0);
	 if (L==4 && (side1 || side2)) test3++;
	 if (side1 && side2) {
	  if (L==4) return openFour;
	  if (L==3) test3++;
	 }
	 if (test3==2) return twoThrees;
	 return -1;
	}

	function evaluatePos(a,mySq) {
	 maxA=-1;
	 for (i=0;i<SIZE[0];i++) {
	  for (j=0;j<SIZE[1];j++) {

	   // Compute "value" a[i][j] of the (i,j) move

	   if (f[i][j]!=0) {a[i][j]=-1; continue;}  
	   if (hasNeighbors(i,j)==0) {a[i][j]=-1; continue;}
	   wp=winningPos(i,j,mySq);
	   if (wp==winningMove) {a[i][j]=winningMove; return winningMove;}
	   if (wp>=twoThrees)   {a[i][j]=wp; if (maxA<wp) maxA=wp; continue;}

	   minM=i-4; if (minM<0) minM=0;
	   minN=j-4; if (minN<0) minN=0;
	   maxM=i+5; if (maxM>SIZE[0]) maxM=SIZE[0];
	   maxN=j+5; if (maxN>SIZE[1]) maxN=SIZE[1];

	   nPos[1]=1; A1=0;
	   m=1; while (j+m<maxN  && f[i][j+m]!=-mySq) {nPos[1]++; A1+=w[m]*f[i][j+m]; m++}
	   if (j+m>=SIZE[1] || f[i][j+m]==-mySq) A1-=(f[i][j+m-1]==mySq)?(w[5]*mySq):0;
	   m=1; while (j-m>=minN && f[i][j-m]!=-mySq) {nPos[1]++; A1+=w[m]*f[i][j-m]; m++}   
	   if (j-m<0 || f[i][j-m]==-mySq) A1-=(f[i][j-m+1]==mySq)?(w[5]*mySq):0;

	   nPos[2]=1; A2=0;
	   m=1; while (i+m<maxM  && f[i+m][j]!=-mySq) {nPos[2]++; A2+=w[m]*f[i+m][j]; m++}
	   if (i+m>=SIZE[0] || f[i+m][j]==-mySq) A2-=(f[i+m-1][j]==mySq)?(w[5]*mySq):0;
	   m=1; while (i-m>=minM && f[i-m][j]!=-mySq) {nPos[2]++; A2+=w[m]*f[i-m][j]; m++}   
	   if (i-m<0 || f[i-m][j]==-mySq) A2-=(f[i-m+1][j]==mySq)?(w[5]*mySq):0;

	   nPos[3]=1; A3=0;
	   m=1; while (i+m<maxM  && j+m<maxN  && f[i+m][j+m]!=-mySq) {nPos[3]++; A3+=w[m]*f[i+m][j+m]; m++}
	   if (i+m>=SIZE[0] || j+m>=SIZE[1] || f[i+m][j+m]==-mySq) A3-=(f[i+m-1][j+m-1]==mySq)?(w[5]*mySq):0;
	   m=1; while (i-m>=minM && j-m>=minN && f[i-m][j-m]!=-mySq) {nPos[3]++; A3+=w[m]*f[i-m][j-m]; m++}   
	   if (i-m<0 || j-m<0 || f[i-m][j-m]==-mySq) A3-=(f[i-m+1][j-m+1]==mySq)?(w[5]*mySq):0;

	   nPos[4]=1; A4=0;
	   m=1; while (i+m<maxM  && j-m>=minN && f[i+m][j-m]!=-mySq) {nPos[4]++; A4+=w[m]*f[i+m][j-m]; m++;}
	   if (i+m>=SIZE[0] || j-m<0 || f[i+m][j-m]==-mySq) A4-=(f[i+m-1][j-m+1]==mySq)?(w[5]*mySq):0;
	   m=1; while (i-m>=minM && j+m<maxN  && f[i-m][j+m]!=-mySq) {nPos[4]++; A4+=w[m]*f[i-m][j+m]; m++;} 
	   if (i-m<0 || j+m>=SIZE[1] || f[i-m][j+m]==-mySq) A4-=(f[i-m+1][j+m-1]==mySq)?(w[5]*mySq):0;

	   dirA[1] = (nPos[1]>4) ? A1*A1 : 0;
	   dirA[2] = (nPos[2]>4) ? A2*A2 : 0;
	   dirA[3] = (nPos[3]>4) ? A3*A3 : 0;
	   dirA[4] = (nPos[4]>4) ? A4*A4 : 0;

	   A1=0; A2=0;
	   for (k=1;k<5;k++) {
	    if (dirA[k]>=A1) {A2=A1; A1=dirA[k]}
	   }
	   thisA=A1+A2;

	   a[i][j]=thisA;
	   if (thisA>maxA) {
	    maxA=thisA;
	   }
	  }
	 }
	 return maxA;
	}


// call above written function, enjoy now
drawBoard();

function openSocket(){
	// Ensures only one connection is open at a time
	if(webSocket !== undefined && webSocket.readyState !== WebSocket.CLOSED){
	console.log("WebSocket is already opened.");
	return;
	}
	// Create a new instance of the websocket
	webSocket = new WebSocket("ws://localhost:8080/caro/");

	/**
	* Binds functions to the listeners for the websocket.
	*/
	webSocket.onopen = function(event){
		// For reasons I can't determine, onopen gets called twice
		// and the first time event.data is undefined.
		// Leave a comment if you know the answer.
		if(event.data === undefined)
		return;

		
	};

	webSocket.onmessage = function(event){
	//showMessage(event.data, "Server")

		if (event.data == OPPONENT_FOUND_YOU_GO_FIRST) {
		myTurn = true;
		showMessage("FOUND OPPONENT -- YOU GO FIRST", "System");
		$("#modalSearch").modal("hide");
		return;
		}

		if (event.data == OPPONENT_FOUND_YOU_GO_SECOND) {
		myTurn = false;
		showMessage("FOUND OPPONENT -- YOU GO SECOND!!\nWait your opponent move", "System");
		$("#modalSearch").modal("hide");
		return;
		}

		if (event.data == SURRENDER) {
		myTurn = false;
		alert("YOUR OPPONENT SURRENDER -- YOU WIN!!");
		$("#btnNewgame").hide();
		return;
		}

		if (event.data == ERROR) {
		myTurn = false;
		alert("AN ERROR HAS OCCURED -- !!");
		$("#btnNewgame").hide();
		return;
		}

		if (event.data.indexOf(PLAY_MOVE) == 0) {
		myTurn = true;

		var arrMove = event.data.split("_");
		var i = parseInt(arrMove[1]);
		var j = parseInt(arrMove[2]);

		f[i][j] = OPPENENT_MOVE;

		drawAndHighlightOpponentMove(i, j);

		dly=(document.images)?10:SIZE[0]*30;

		if (winningPos(i,j,OPPENENT_MOVE)==winningMove){
		myTurn = false;
		alert('You loose!');
		$("#btnNewgame").show();
		}

		return;
		}

		if (event.data.indexOf(CHAT) == 0) {
		var arrMsg = event.data.split("_");
		showMessage(arrMsg[1], "Opponent");
		return;
		}

	};

	webSocket.onclose = function(event){
		console.log("Connection closed");
	};
}


function findOpponent(isFind){
	if(playWithCom){
		return;
	}      	

	var isWebSocketAvailable = (webSocket !== undefined && webSocket.readyState !== WebSocket.CLOSED);

	
	if (isFind){
		$("#modalPlay").modal("show");
		$("#modalSearch").modal("show");

		console.log(webSocket.readyState);

		if (isWebSocketAvailable){
			webSocket.send(FIND_OPPONENT);
			console.log("finddd = " + isFind); 	    			        		
		}
	}
	else{
		$("#modalSearch").modal("hide");
		$("#modalPlay").modal("hide");
		if (isWebSocketAvailable)
			webSocket.send(STOP_FINDING_OPPONENT);        		
	}
}




function keyEnterPressed(event){
	if (event.keyCode == 13){
		send();	
		return false;			
	}
	return true;
}

function send(){
	var msg = $("#message").val();
	if (msg.trim() != ""){
		showMessage(msg, "Me");
		if (webSocket !== undefined && webSocket.readyState !== WebSocket.CLOSED){
			webSocket.send(CHAT + msg);
		}
		$("#message").val("");
	}
}

function showMessage(message, name){
	document.getElementById("chattext").innerHTML += (name + ": " + message + "<br>");
}
