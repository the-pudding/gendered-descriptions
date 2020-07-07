/* global d3 */
import firebase from '@firebase/app';
import '@firebase/database';
import generateID from './generate-id';
import checkStorage from './check-storage';

const DEV = false;
let firebaseApp = null;
let firebaseDB = null;
let userData = {};
let connected = false;

const hasStorage = checkStorage('localStorage');

function formatDecimal(d) {
  return d3.format('.2f')(d);
}

function getAnswer(id) {
  if (userData.answers) return userData.answers[id];
  return null;
}

function getAnswers() {
  if (userData.answers)
    return userData.answers;
    // return Object.keys(userData.answers)
    //   .map(k => userData.answers[k])
    //   .map(d => ({ ...d, min: +d.min, max: +d.max }));
  return null;
}

function getAnswerCount() {
  return Object.keys(userData.answers).length;
}

function hasAnswers() {
  return !!Object.keys(userData.answers).length;
}

function getReturner() {
  return userData.returner;
}

function getSeenResults() {
  return userData.results;
}

function setResults() {
  userData.results = 'true';
  if (hasStorage) window.localStorage.setItem('pudding_laugh_results', 'true');
}

function setReturner() {
  userData.returner = 'true';
  if (hasStorage) window.localStorage.setItem('pudding_laugh_returner', 'true');
}

function setupUserData() {
  if (hasStorage) {
    let id = window.localStorage.getItem('gendered_id');
    if (!id) {
      id = generateID({ chron: true, numbers: false });
      console.log(id);
      window.localStorage.setItem('gendered_id', id);
    }

    let answers = window.localStorage.getItem('gendered_id_answers');
    answers = answers ? JSON.parse(answers) : null;

    // const returner = window.localStorage.getItem('pudding_laugh_returner');
    // const results = window.localStorage.getItem('pudding_laugh_results');

    //return { id, answers, returner, results };
    return { id, answers };

  }

  // const newID = generateID({ chron: true, numbers: false });
  // window.localStorage.setItem('pudding_song_id', newID);
  // return { id: newID, answers: {}, returner: false };
}

function connect() {
  // Initialize Firebase
  const config = {
    apiKey: 'AIzaSyDUeHy3OIExm20nCUeNk5QZU8vIF_10o6k',
    authDomain: 'gendered-eded1.firebaseio.com',
    databaseURL: 'https://gendered-eded1.firebaseio.com/',
    projectId: 'gendered-eded1',
  };
  firebaseApp = firebase.initializeApp(config);
  firebaseDB = firebaseApp.database();
  connected = true;
}

function clear() {
  console.log("clearing");
  localStorage.removeItem('gendered_id');
  localStorage.removeItem('gendered_id_answers');
}

function setup() {
  if (window.location.host.includes('localhost')) clear();
  userData = setupUserData();
  if(!connected){
    if (!userData.finished) connect();
  }
  console.log({ userData });
}

function closeConnection() {
  if (connected)
    firebaseApp.delete().then(() => {
      connected = false;
    });
}

function finish() {
  userData.finished = 'true';
  if (hasStorage) window.localStorage.setItem('gendered_id_finished', 'true');
  closeConnection();
}

function getSubmissions(data) {
  const output = {};
  Object.keys(data).forEach(d => {
    const g = data[d];
    // add to submit list
    if (g.store === 'true') output[d] = g;
  });
  return output;
}

function update(output) {
  // userData.answers[key] = {
  //   key,
  //   order,
  //   min: min ? formatDecimal(min) : '1.00',
  //   max: max ? formatDecimal(max) : '5.00',
  //   store: min && max ? 'true' : 'false',
  // };
  userData.answers = output
  console.log(hasStorage);
  if (hasStorage)
    window.localStorage.setItem(
      'gendered_id_answers',
      JSON.stringify(userData.answers)
    );

  if (!DEV && connected) {
    firebaseDB

      .ref(userData.id)
      .set({ output })
      .then(() => {
        // console.log('saved');
      })
      .catch(console.log);
  }
}

export default {
  setup,
  update,
  finish,
  getAnswer,
  getAnswers,
  getSeenResults,
  setResults,
  clear,
  hasAnswers,
  setReturner,
  getReturner,
  getAnswerCount,
  closeConnection,
};
