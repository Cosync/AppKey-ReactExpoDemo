/* eslint-disable no-alert */

//
//  PasskeyScreen.js
//  AppKey
//
//  Licensed to the Apache Software Foundation (ASF) under one
//  or more contributor license agreements.  See the NOTICE file
//  distributed with this work for additional information
//  regarding copyright ownership.  The ASF licenses this file
//  to you under the Apache License, Version 2.0 (the
//  "License"); you may not use this file except in compliance
//  with the License.  You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing,
//  software distributed under the License is distributed on an
//  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
//  KIND, either express or implied.  See the License for the
//  specific language governing permissions and limitations
//  under the License.
//
//  Created by Tola Voeung.
//  Copyright © 2025 cosync. All rights reserved.
//

import React, { useEffect, useState, useContext } from 'react';
import {
  StyleSheet,
  Image,
  View,
  Text, 
  TouchableOpacity,
  Alert

} from 'react-native';
import { Passkey } from 'react-native-passkey';
import base64url from 'base64url'; 
import { AuthContext } from '../context/AuthContext';


const PasskeyScreen = props => { 
  
  let [errortext, setErrortext] = useState();
  let [successText, setSuccessText] = useState();
  
  let [selectedKey, setSelectedKey] = useState();
  let [keyOptions, setKeyOptions] = useState({ addingKey: false, editingKey: false, deletingKey: false });

  let [authenticators, setAuthenticators] = useState([]);

  const { userData, verify, verifyComplete, addPasskey, addPasskeyComplete, updatePasskey, removePasskey } = useContext(AuthContext);

  useEffect(() => {
    if (userData !== undefined) {
      if (userData.authenticators && userData.loginProvider === 'handle') {
        setAuthenticators(userData.authenticators);
      }

      console.log('userData ', userData);
    }
  }, [userData]);

  useEffect(() => {
    if (keyOptions.addingKey || keyOptions.editingKey || keyOptions.deletingKey) { verifyAlert(); }
  }, [keyOptions, verifyAlert]);

  const toggleKeyOption = (type) => {
    if (type === 'clear') {
      setKeyOptions({
        ...keyOptions,
        ['addingKey']: false,
        ['editingKey']: false,
        ['deletingKey']: false
      });
    }
    else {
      setKeyOptions({
        ...keyOptions,
        [type]: true
      });
    }
  };



  const handleAddKey = () => {
    toggleKeyOption('addingKey');
  };


  const handleUpdatePasskey = (key) => {
    setSelectedKey(key);
    toggleKeyOption('editingKey');

  };


  const handleDeletePasskey = (key) => {
    setSelectedKey(key);
    toggleKeyOption('deletingKey');

  };

  const showInfoText = (type, text) => {
    if (type === 'error'){
      setErrortext(text);
      setSuccessText();
    } 
    else{
      setErrortext();
      setSuccessText(text);
    } 
  };


  // eslint-disable-next-line react-hooks/exhaustive-deps
  const verifyAlert = () => {

    Alert.alert('Verify Your Account', 'Please verify your account before manage this passkey.', [
      {
        text: 'Cancel',
        onPress: () => toggleKeyOption('clear'),
        style: 'cancel',
      },
      { text: 'Verify', onPress: () => verifyAccount() },
    ]
    );
  };

  const verifyAccount = async () => {

    console.log('verifyAccount userData.handle ', userData.handle);

    let result = await verify({ handle: userData.handle });

    console.log('verifyAccount result ', result);

    if (result.code && result.message) {
      showInfoText('error', result.message);
      return;
    }

    result.challenge = base64url.toBase64(result.challenge);

    let assertion = await Passkey.get(result);
    if (!assertion.id) {
      showInfoText('error', 'Invalid Passkey');
      return;
    }

    const convertToAuthenticationResponseJSON = {

      id: base64url.fromBase64(assertion.id),
      rawId: base64url.fromBase64(assertion.rawId),
      response: {
        clientDataJSON: base64url.fromBase64(assertion.response.clientDataJSON),
        authenticatorData: base64url.fromBase64(assertion.response.authenticatorData),
        signature: base64url.fromBase64(assertion.response.signature),
      },
      clientExtensionResults: {},
      handle: userData.handle,
      type: 'public-key'
    };

    let authn = await verifyComplete(convertToAuthenticationResponseJSON);
    console.log('verifyComplete ', authn);

    if (authn.code && authn.message) {
      showInfoText('error', authn.message);
      return;
    }

    console.log('keyOptions ', keyOptions);


    if (keyOptions.addingKey) { await addPasskeyHandler(); }
    else if (keyOptions.editingKey) { await editPasskeyHandler(); }
    else if (keyOptions.deletingKey) { await deletePasskeyHandler(); }


  };

  const deletePasskeyHandler = async () => {
    Alert.alert('Delete Your Passkey', `Are you sure you want to delete this passkey: "${selectedKey.name}"`, [
      {
        text: 'Cancel',
        onPress: () => toggleKeyOption('clear'),
        style: 'cancel',
      },
      { text: 'Delete', style: 'destructive', onPress: () => deletePasskeySubmit() },
    ]
    );
  };

  const deletePasskeySubmit = async () => {

    let result = await removePasskey(selectedKey.id);
    if(result.error){
      showInfoText('error'. result.error.message);
    }
    else {
      showInfoText('success', 'Passkey is deleted');
    }
  };

  const editPasskeyHandler = async () => {

    Alert.prompt(
     'Update Passkey',
      'Enter your passkey name',
      [
        { text: 'Cancel', style: 'destructive', onPress: () => {} },
        {
          text: 'Submit',
          onPress: (keyName) => {
            updatePasskeySubmit(keyName);
          },
        },
      ],
      'plain-text'
    );
 
  };

 

  const updatePasskeySubmit = async (keyName) => {
    let result = await updatePasskey(selectedKey.id, keyName);
    if(result.error){
      showInfoText('error'. result.error.message);
    }
    else {
      showInfoText('success', 'Passkey is updated');
    }
  };

  const addPasskeyHandler = async () => {

    let challenge = await addPasskey();
    
    if (challenge.error) {
      showInfoText('error', challenge.error.message);
    }
    else {
      challenge.challenge = base64url.toBase64(challenge.challenge);

      let result = await Passkey.create(challenge);
      const convertToRegistrationResponse = {
        ...result,
        id: base64url.fromBase64(result.id),
        rawId: base64url.fromBase64(result.rawId),
        response: {
          ...result.response,
          attestationObject: base64url.fromBase64(result.response.attestationObject),
          clientDataJSON: base64url.fromBase64(result.response.clientDataJSON),
          clientExtensionResults: {},
          email: userData.handle,
        },
        type: 'public-key',
        handle: userData.handle,
      };

      let authn = await addPasskeyComplete(convertToRegistrationResponse);

      if (authn.error) { showInfoText('error', `Error: ${authn.error.message}`); }
      else {
        showInfoText('success', 'Success');
      }

    }
  };

  

  return (
    <View style={styles.mainBody}>
      
      <View style={{ alignItems: 'center' }}>
        <Image
          source={require('../assets/applogo.png')}
          style={styles.iconStyle}
        />
      </View>

      <View>

        <Text style={styles.titileTextStyle}>Manage Passkey</Text>
        <Text style={styles.bodyTextStyle}>{userData.handle}</Text>

        {
          errortext ? <Text style={styles.errorTextStyle}> {errortext} </Text> :
            successText ?
              <Text style={styles.successTextStyle}> {successText} </Text> : null
        }


        <View style={styles.viewSection}>

          <Text style={styles.bodyTextStyle}> Your Passkey: {authenticators.length}</Text>

          {


            authenticators.map(function (key, index) {
              return (
                <View style={styles.viewRowStyle} key={index}>

                  <Text style={styles.keyTextStyle}> {key.name}</Text>
                  <View style={styles.keyButtonStyle}>
                    <TouchableOpacity
                      style={styles.editButton}
                      activeOpacity={0.5}
                      onPress={() => handleUpdatePasskey(key)}>
                      <Text style={styles.buttonTextStyleSmall}>Edit</Text>
                    </TouchableOpacity>
                    {authenticators.length > 1 &&
                      <TouchableOpacity
                        style={styles.deleteButton}
                        activeOpacity={0.5}
                        onPress={() => handleDeletePasskey(key)}>
                        <Text style={styles.buttonTextStyleSmall}>Delete</Text>
                      </TouchableOpacity>
                    }
                  </View>
                </View>
              );
            })

          }

        </View>


        <View style={styles.viewSection}>

          <View style={styles.sectionStyle}>
            <TouchableOpacity
              style={styles.buttonStyle}
              activeOpacity={0.5}
              onPress={handleAddKey}>
              <Text style={styles.buttonTextStyle}>Add Passkey</Text>
            </TouchableOpacity>
          </View>

        </View>

      </View>



    </View>
  );
  
};

export default PasskeyScreen;

const styles = StyleSheet.create({
  mainBody: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  iconStyle: {
    height: 200,
    resizeMode: 'contain',
    margin: 30,
  },
  infoSection: {
    margin: 10,
  },
  viewSection: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionStyle: {
    flexDirection: 'row',
    height: 40,
    marginTop: 20,
    marginLeft: 35,
    marginRight: 35,
    margin: 10,
  },
  buttonStyle: {
    backgroundColor: '#4638ab',
    borderWidth: 0,
    color: '#FFFFFF',
    borderColor: '#7DE24E',
    height: 40,
    width: 150,
    alignItems: 'center',
    borderRadius: 30,
    marginLeft: 35,
    marginRight: 35,
    marginTop: 20,
    marginBottom: 20,
  },

  buttonStyleRed: {
    backgroundColor: '#e94541',
    borderWidth: 0,
    color: '#FFFFFF',
    borderColor: '#7DE24E',
    height: 40,
    width: 150,
    alignItems: 'center',
    borderRadius: 30,
    marginLeft: 35,
    marginRight: 35,
    marginTop: 20,
    marginBottom: 20,
  },

  buttonTextStyle: {
    color: 'white',
    paddingVertical: 10,
    fontSize: 16,
  },
  inputStyle: {
    flex: 1,
    color: '#4638ab',
    paddingLeft: 15,
    paddingRight: 15,
    borderWidth: 1,
    borderRadius: 30,
    borderColor: '#4638ab',
  },
  titileTextStyle: {
    color: '#4638ab',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  headerTextStyle: {
    color: '#4638ab',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bodyTextStyle: {
    color: '#4638ab',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  errorTextStyle: {
    color: 'red',
    textAlign: 'center',
    fontSize: 14,
  },
  successTextStyle: {
    color: 'blue',
    textAlign: 'center',
    fontSize: 14,
  },

  viewRowStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderColor: '#485a96',
    height: 60,
    width: '95%',
    borderRadius: 5,
    margin: 5,
    padding: 5,
  },
  editButton: {
    backgroundColor: '#485a96',
    color: '#485a96',
    borderColor: '#7DE24E',
    height: 40,
    width: 60,
    alignItems: 'center',
    borderRadius: 10,
    marginLeft: 10,
    marginRight: 10,

  },
  deleteButton: {
    backgroundColor: '#e94541',
    color: '#485a96',
    borderColor: '#7DE24E',
    height: 40,
    width: 60,
    alignItems: 'center',
    borderRadius: 10,
    marginLeft: 10,
    marginRight: 10,

  },
  buttonTextStyleSmall: {
    color: 'white',
    paddingVertical: 12,
    fontSize: 13,
  },
  keyTextStyle: {
    color: '#4638ab',
    textAlign: 'left',
    fontSize: 14,

  },
  keyButtonStyle: {
    flexDirection: 'row',
  }
});
