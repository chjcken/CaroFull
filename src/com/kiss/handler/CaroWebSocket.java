package com.kiss.handler;


import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;

import com.kiss.util.Message;

public class CaroWebSocket extends WebSocketAdapter {
	
	private static final ConcurrentHashMap<Session, Session> players = new ConcurrentHashMap<>();;
	private static final List<Session> waitingQueue = new ArrayList<>();;

	
	
	@Override
	public void onWebSocketConnect(Session sess) {
		try {
			sess.getRemote().sendString("hello -- i'm websocket");
			System.err.println("connect created -- " + sess.getRemoteAddress().getHostName());
		} catch (IOException e) {
			e.printStackTrace();
		}
		super.onWebSocketConnect(sess);
	}
	
	@Override
	public void onWebSocketClose(int statusCode, String reason) {
		System.err.println("close --- " + reason);
		
		removeFromPlayerList(getSession());
		
		super.onWebSocketClose(statusCode, reason);
	}
	
	@Override
	public void onWebSocketText(String message) {
		System.err.println("message from -- " + getSession().getRemoteAddress().getHostName() + ":\t" + message);

		
		try {				
			if (message == null) {
				getRemote().sendString(Message.ERROR);
				return;
			}
			
			if (message.startsWith(Message.FIND_OPPONENT)){
				Session opponentSession = findOpponent();
				if (opponentSession == null || opponentSession == getSession()){
					getRemote().sendString("noone -- wait");
					enterWaitingQueue(getSession());
				}
				else { //found
					putToPlayerList(getSession(), opponentSession);
					
					//notify
					getRemote().sendString(Message.OPPONENT_FOUND_YOU_GO_SECOND);
					opponentSession.getRemote().sendString(Message.OPPONENT_FOUND_YOU_GO_FIRST);
				}		
				

				System.err.println(waitingQueue.size());
			}
			
			else if (message.startsWith(Message.STOP_FINDING_OPPONENT)){
				leaveWaitingQueue(getSession());
			}
			
			else {
				Session opponent = players.get(getSession());
				if (opponent == null){
					getRemote().sendString(Message.ERROR);
					return;
				}
				
				opponent.getRemote().sendString(message);
				
				if (message.startsWith(Message.SURRENDER) || message.startsWith(Message.ERROR)){
					removeFromPlayerList(getSession());
				}
			}
			
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		
	}
	
	private Session findOpponent(){
		synchronized (waitingQueue) {
			if (waitingQueue.isEmpty())
				return null;
			else
				return waitingQueue.remove(0);
		}
	}
	
	private void enterWaitingQueue(Session clientSession){
		synchronized (waitingQueue) {
			waitingQueue.add(clientSession);
		}
	}
	
	private void leaveWaitingQueue(Session clientSession){
		synchronized (waitingQueue) {
			waitingQueue.remove(clientSession);
		}
	}
	
	private void putToPlayerList(Session player1, Session player2){
		players.put(player1, player2);
		players.put(player2, player1);
	}
	
	private void removeFromPlayerList(Session player){
		Session opponent = players.get(player);
		players.remove(player);
		try {
			opponent.getRemote().sendString(Message.SURRENDER);
			players.remove(opponent);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	
}
