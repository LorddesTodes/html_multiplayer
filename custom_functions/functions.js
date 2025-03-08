//all functions
function xorCipher(input, key) {
  let output = '';
  const repeatedInput = input.repeat(key.length);
  for (let i = 0; i < key.length; i++) {
      output += String.fromCharCode(repeatedInput.charCodeAt(i) ^ key.charCodeAt(i));
  }
  return output + '/%/' + key.length/input.length + '/%/' + "||".repeat(input.length*2);
}

function decodeXorCipher(encoded,key) {
  if(!encoded.includes('/%/')){return("error: cant decode non encoded text")}
  const parts = encoded.split('/%/');
  const encodedText = parts[0];
  const inputLength = parts[2].length/4;
  const keyLength = parseInt(parts[1], 10)*inputLength;
  let output = '';
  for (let i = 0; i < encodedText.length; i++) {
      const inputChar = encodedText.charCodeAt(i);
      const keyChar = key.charCodeAt(i % keyLength);
      output += String.fromCharCode(inputChar ^ keyChar);
  }
  output = output.slice(0,inputLength)
  
  return output;
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function conJson(str) {
  if (isJsonString(str)) {
    return JSON.parse(str);
  }
}

function hasJsonKey(json,key) {
  if (typeof json === 'object') {
    for (let i in json) {
      if (i === key) {
        return true;
      }
    }
    return false;
  }
}

const rand = () => {
  tmp2 = Math.random().toString(36).substr(2)
  ri = Math.floor(Math.random() * tmp2.length)
	return tmp2.slice(ri,ri+1);
};

const token = (len) => {
  tmp = ""
  for (let i = 0; i < len; i++) {
    tmp = tmp + rand();
  }
	return tmp
};

function hasJsonText(json,text) {
  for (const key in json) {
    try {
      const element = json[key];
      if(element==text) return true
    } catch(e){}
  }
  return false
}

function hasJsonJsonText(json,text) {
  for (const key1 in json) {
    try {
      const element1 = json[key1];
      for (const key2 in element1) {
        try {
          const element2 = element1[key2];
          if(element2==text) return true
        } catch(e){}
      }
    } catch(e){}
  }
  return false
}

function hasJsonJsonTextAndId(json,text,key) {
  for (const key1 in json) {
    try {
      const element1 = json[key1];
      for (const key2 in element1) {
        try {
          const element2 = element1[key2];
          if(element2==text&&key2==key) return true
        } catch(e){}
      }
    } catch(e){}
  }
  return false
}

function getAsArray(json,toGet){
  let arr = []
  for (const key in json) {
    arr.push(json[key][toGet])
  }
  return arr
}

function getTypesAmount(json,toGet){
  let cou = 0
  for (const key in json) {
    if (toGet in json[key]){
      cou = cou + 1
    }
  }
  return cou
}

// Export the functions

module.exports = {
    encode: (text, key) => xorCipher(text, key),
    decode: (text, key) => decodeXorCipher(text, key),
    conJson: (string) => conJson(string),
    isJson: (string) => isJsonString(string),
    genToken: (len) => token(len),
    hasJsonText: (json, text) => hasJsonText(json, text),
    hasJsonJsonText: (json, text) => hasJsonJsonText(json, text),
    getAsArray: (json, toGet) => getAsArray(json, toGet),
    getTypesAmount: (json, toGet) => getTypesAmount(json, toGet),
    hasJsonKey: (json, key) => hasJsonKey(json, key),
    hasJsonJsonTextAndId: (json, text, key) => hasJsonJsonTextAndId(json,text,key)
};
