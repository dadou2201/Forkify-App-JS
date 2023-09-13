import { async } from 'regenerator-runtime';
import { TIMEOUT_SEC } from './config.js';

const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${s} second`));
    }, s * 1000);
  });
};

export const AJAX = async function (url, uploadData = undefined) {
  try {
    const fetchPro = uploadData
      ? fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(uploadData),
        })
      : fetch(url);
    const res = await Promise.race([fetchPro, timeout(TIMEOUT_SEC)]); //va faire la course entre le timeur et le url

    const data = await res.json(); // convertit la reponse en json

    if (!res.ok) throw new Error(`${data.message} ${res.status}`); // si la reponse ne renvoi pas une recette on renvoi le message d erreur
    return data;
  } catch (err) {
    throw err;
  }
};

/*
export const getJSON = async function (url) {
  try {
    const fetchPro = fetch(url);
    const res = await Promise.race([fetchPro, timeout(TIMEOUT_SEC)]); //va faire la course entre le timeur et le url

    const data = await res.json(); // convertit la reponse en json

    if (!res.ok) throw new Error(`${data.message} ${res.status}`); // si la reponse ne renvoi pas une recette on renvoi le message d erreur
    return data;
  } catch (err) {
    throw err;
  }
};

export const sendJSON = async function (url, uploadData) {
  try {
    const fetchPro = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadData),
    });
    const res = await Promise.race([fetchPro, timeout(TIMEOUT_SEC)]); //va faire la course entre le timeur et le url

    const data = await res.json(); // convertit la reponse en json

    if (!res.ok) throw new Error(`${data.message} ${res.status}`); // si la reponse ne renvoi pas une recette on renvoi le message d erreur
    return data;
  } catch (err) {
    throw err;
  }
};
*/