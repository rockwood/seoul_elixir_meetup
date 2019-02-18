import "../css/app.css";
import "phoenix_html";
import "webrtc-adapter";

import socket from "./socket";

let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');
let connectButton = document.getElementById("connect");
let disconnectButton = document.getElementById("disconnect");

let channel = socket.channel("call", {});

channel.join()
  .receive("ok", () => console.log("Joined call channel successfully"))
  .receive("error", () => console.log("Unable to join"));

channel.on("message", payload => {
  let message = JSON.parse(payload.body);

  console.log("MESSAGE RECEIVED", message);

  switch(message.type) {
  case "new-ice-candidate":
    handleNewICECandidateMsg(message);
    break;

  case "video-offer":
    handleVideoOfferMsg(message);
    break;

  case "video-answer":
    handleVideoAnswerMsg(message);
    break;
  }
});

let peerConnection = new RTCPeerConnection({
  iceServers: [{
    'url': 'stun:stun.example.org'
  }]
});

peerConnection.onicecandidate = handleICECandidateEvent;
peerConnection.ontrack = handleAddTrackEvent;
peerConnection.onremovetrack = handleRemoveTrackEvent;
peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;

connectButton.onclick = connect;
disconnectButton.onclick = disconnect;

function broadcast(message) {
  console.log("MESSAGE SENT", message);

  channel.push("message", { body: JSON.stringify(message) });
}

function connect() {
  console.log("Requesting local stream");

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((localStream) => {
      localVideo.srcObject = localStream;
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    })
    .then(() => {
      connectButton.disabled = true;
      disconnectButton.disabled = false;
    })
    .catch(handleError);
}

function disconnect() {
  closeVideoCall();
  broadcast({ type: "disconnect" });
}

function closeVideoCall() {
  remoteVideo.removeAttribute("src");
  remoteVideo.removeAttribute("srcObject");
  localVideo.removeAttribute("src");
  remoteVideo.removeAttribute("srcObject");

  connectButton.disabled = false;
  disconnectButton.disabled = true;
}

function handleICECandidateEvent(event) {
  if (event.candidate) {
    broadcast({ type: "new-ice-candidate", candidate: event.candidate });
  }
}

function handleNegotiationNeededEvent() {
  peerConnection
    .createOffer()
    .then((offer) => peerConnection.setLocalDescription(offer))
    .then(() => broadcast({ type: "video-offer", sdp: peerConnection.localDescription }))
    .catch(handleError);
}

function handleAddTrackEvent(event) {
  remoteVideo.srcObject = event.streams[0];
}

function handleRemoveTrackEvent(event) {
  var stream = remoteVideo.srcObject;
  var trackList = stream.getTracks();

  if (trackList.length == 0) {
    closeVideoCall();
  }
}

function handleICEConnectionStateChangeEvent(event) {
  switch(peerConnection.iceConnectionState) {
    case "closed":
    case "failed":
    case "disconnected":
      closeVideoCall();
      break;
  }
}

function handleSignalingStateChangeEvent(event) {
  switch(peerConnection.signalingState) {
    case "closed":
      closeVideoCall();
      break;
  }
};

function handleVideoOfferMsg(msg) {
  peerConnection
    .setRemoteDescription(new RTCSessionDescription(msg.sdp))
    .then(() => navigator.mediaDevices.getUserMedia({ audio: true, video: true }))
    .then((remoteStream) => {
      remoteVideo.srcObject = remoteStream;
    })
    .then(() => peerConnection.createAnswer())
    .then((answer) => peerConnection.setLocalDescription(answer))
    .then(() => broadcast({ type: "video-answer", sdp: peerConnection.localDescription}))
    .catch(handleError);
}

function handleNewICECandidateMsg(msg) {
  var candidate = new RTCIceCandidate(msg.candidate);

  console.log("Adding received ICE candidate: " + JSON.stringify(candidate));

  peerConnection
    .addIceCandidate(candidate)
    .catch(handleError);
}

function handleVideoAnswerMsg(msg) {
  console.log("Call recipient has accepted our call");

  var desc = new RTCSessionDescription(msg.sdp);
  peerConnection
    .setRemoteDescription(desc)
    .catch(handleError);
}

function handleError(...args) {
  console.error(...args);
}
