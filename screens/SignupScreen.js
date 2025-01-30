//
//  SignupScreen.js
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
//  Copyright © 2024 cosync. All rights reserved.
//

import React, { useState, useRef, useEffect, useContext } from 'react'; 
import {  StyleSheet,
  TextInput,
  View,
  Text,
  ScrollView,
  Image,
  Keyboard,
  TouchableOpacity,
  KeyboardAvoidingView, } from 'react-native';
 
import _ from 'lodash';
import Loader from '../components/Loader'; 
import { AuthContext } from '../context/AuthContext';
import { Dropdown } from 'react-native-element-dropdown';
import { Passkey, PasskeyRegistrationResult } from 'react-native-passkey';
import base64url from 'base64url';

const SignupScreen = props => {
  
  let [errorcodetext, setErrorCodetext] = useState('');
  let [errortext, setErrortext] = useState('');
  let [infotext, setInfoText] = useState('');
  let [displayName, setDisplayName] = useState('');
  
  let [userHandle, setUserHandle] = useState(''); 
  let [signupCode, setSignupCode] = useState('');  
  
  let [verifyCode, setVerifyCode] = useState(false);  
  let [userLocale, setUserLocale] = useState('EN');
  const { validateInput, signup, signupConfirm, signupComplete, appLocales } = useContext(AuthContext);

  const ref_input_displayname = useRef();
  const ref_input_email = useRef();
 


  useEffect(() => {
    if (!Passkey.isSupported()) alert("Your device does not have Passkey Authentication.")
  }, []);

 

  const validateForm = () => {
    if (!displayName) {
      alert('Please Fill Display Name');
      return false;
    } 
    
    if (!validateInput(userHandle)) {
      alert('Please Fill a valid handle');
      return false;
    } 

    return true;
  }

  const cancelSignup = async () => {
    setVerifyCode(false);
  }

  const handleSubmitVerifyCodePress = async () => {
    setErrorCodetext('');
    

    try {
        console.log("handleSubmitVerifyCodePress signupCode ", signupCode)
        let authn = await signupComplete(signupCode);

        if(authn.error) setErrorCodetext(`Error: ${authn.error.message}`);
        else {
          setInfoText('Successfully Signup.'); 
          setVerifyCode(false);
        }
      
      
    } catch (error) { 
      console.error(error)
      setErrorCodetext(`Error: ${error.message}`);
    }
     
  }
 
  
  const handleSubmitPress = async () => {

    setErrortext('');
    setInfoText('');

    if(!validateForm()) return

    let result = await signup(userHandle, displayName, userLocale);
    if(result.challenge){

      result.challenge = base64url.toBase64(result.challenge)
      let attestationObject = await Passkey.register(result);
      
      attestationObject.handle = userHandle;

      console.log("sign passkey attResponse ", attestationObject)
      
      const convertToRegistrationResponse = {
        ...attestationObject,
        id: base64url.fromBase64(attestationObject.id),
        rawId: base64url.fromBase64(attestationObject.rawId),
        response: {
          ...attestationObject.response,
          attestationObject: base64url.fromBase64(attestationObject.response.attestationObject),
          clientDataJSON: base64url.fromBase64(attestationObject.response.clientDataJSON),
          clientExtensionResults: {}, 
          email:userHandle
        },
        type: 'public-key',
      };
      console.log("sign passkey convertToRegistrationResponse ", convertToRegistrationResponse)

      let authn = await signupConfirm(convertToRegistrationResponse);
      if(authn['signup-token']){
        setInfoText(authn.message)
        setVerifyCode(true) 
      }
      else if(authn.error) setErrortext(authn.error.message);
    }
    else if (result.error) {
      setErrortext(result.error.message);
    }
    
  };

 
   

 

  return (
    <View style={styles.mainBody}>  
      
      <ScrollView keyboardShouldPersistTaps="handled"> 
      <KeyboardAvoidingView enabled>
            <View style={{ alignItems: 'center' }}>
              <Image
                source={require('../assets/applogo.png')}
                style={{ 
                  height: 200,
                  resizeMode: 'contain',
                  margin: 30,
                }}
              />
            </View>


            <View style={styles.infoSection}>
              <Text style={styles.registerTextStyle}>Welcome to the AppKey demo! Sign up with your email to create your passkey and log in effortlessly. Discover how simple and secure passwordless login can be—no passwords, just your passkey.</Text>
            </View>

            
            {infotext != '' ? (
              <Text style={styles.registerTextStyle}> {infotext} </Text>
            ) : null}

            
         

            {verifyCode ?
            <View> 
              <View style={styles.sectionStyle}>
                <TextInput
                  style={styles.inputStyle}
                  value={signupCode}
                  onChangeText={value => setSignupCode(value)} 
                  placeholder="Enter 6 digits Code"
                  keyboardType="numeric" 
                  returnKeyType="go" 
                  blurOnSubmit={false}  
                  onSubmitEditing={() => Keyboard.dismiss, handleSubmitVerifyCodePress}
                /> 

              </View> 

              {errorcodetext != '' &&  <Text style={styles.errorTextStyle}> {errorcodetext} </Text> }

              <TouchableOpacity
                style={styles.buttonStyle}
                activeOpacity={0.5}
                onPress={handleSubmitVerifyCodePress}>
                <Text style={styles.buttonTextStyle}>SUBMIT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonInoStyle}
                activeOpacity={0.5}
                onPress={cancelSignup}>
                <Text style={styles.buttonTextStyle}>CANCEL</Text>
              </TouchableOpacity>

            </View> : 
            <View>
              <View style={styles.sectionStyle}>
              <TextInput
                style={styles.inputStyle}
                onChangeText={value => setDisplayName(value)} 
                placeholder="Enter Display Name" 
                autoCorrect={false}
                keyboardType="default" 
                returnKeyType="next" 
                onSubmitEditing={() => ref_input_email.current.focus()}
                blurOnSubmit={false}
                ref={ref_input_displayname}
              />
            </View> 

            <View style={styles.sectionStyle}>
              <TextInput
                style={styles.inputStyle}
                onChangeText={value => setUserHandle(value)}
                //underlineColorAndroid="#4638ab"
                placeholder="Enter User Handle"
                autoCapitalize="none" 
                autoCorrect={false}
                keyboardType="email-address" 
                returnKeyType="next" 
                onSubmitEditing={() => Keyboard.dismiss, handleSubmitPress}
                blurOnSubmit={false}
                ref={ref_input_email}
              />
            </View>

            

            {appLocales && appLocales.length > 1 ? 
              <View style={styles.viewSection}>
                <Text style={styles.textItem}>Set Localization</Text>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}  
                  data={appLocales} 
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Set Localization" 
                  value={userLocale}
                  onChange={item => {
                    setUserLocale(item.value);
                  }}
                  
                />
              </View>
              : null
            
              }

            {errortext != '' ? (
              <Text style={styles.errorTextStyle}> {errortext} </Text>
            ) : null}

            <TouchableOpacity
              style={styles.buttonStyle}
              activeOpacity={0.5}
              onPress={handleSubmitPress}>
              <Text style={styles.buttonTextStyle}>SIGN UP</Text>
            </TouchableOpacity>

            </View>}

        </KeyboardAvoidingView>
      </ScrollView>
    </View>

  );
};
export default SignupScreen;

const styles = StyleSheet.create({
  mainBody: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  sectionStyle: {
    flexDirection: 'row',
    height: 40,
    marginTop: 20,
    marginLeft: 35,
    marginRight: 35,
    margin: 10,
  },
  infoSection:{ 
    margin: 10,
  },
  buttonInoStyle: {
    backgroundColor: '#0b090a',
    borderWidth: 0,
    color: '#FFFFFF',
    borderColor: '#7DE24E',
    height: 40,
    alignItems: 'center',
    borderRadius: 30,
    marginLeft: 35,
    marginRight: 35,
    marginTop: 20,
    marginBottom: 20,
  },
  buttonStyle: {
    backgroundColor: '#4638ab',
    borderWidth: 0,
    color: '#FFFFFF',
    borderColor: '#7DE24E',
    height: 40,
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
  registerTextStyle: {
    color: '#4638ab',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorTextStyle: {
    color: 'red',
    textAlign: 'center',
    fontSize: 14,
  },
  viewSection: {  
    marginTop: 20, 
    marginBottom: 20,
    alignItems: "center",
  },
  dropdown: {
    margin: 16,
    height: 50,
    width: 150,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
  },
  
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  } 
});