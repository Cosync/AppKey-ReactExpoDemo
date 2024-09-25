 
//
//  LoginScreen.js
//  PassClef
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

import React, {useEffect, useState, useRef, useContext } from 'react'; 
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  ScrollView,
  Image,
  Keyboard,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native'; 
import Loader from '../components/Loader';  
import { Passkey } from 'react-native-passkey'; 

import base64url from 'base64url';
 
import { AuthContext } from '../context/AuthContext';

const LoginScreen = props => {
  
  let [userEmail, setUserEmail] = useState(''); 
  let [loading, setLoading] = useState(false); 
  let [errortext, setErrortext] = useState(''); 

  const { login, loginComplete, loginAnonymous, loginAnonymousComplete, appData} = useContext(AuthContext);
  global.Buffer = require('buffer').Buffer;

  
  useEffect(() => {
    if (!Passkey.isSupported()) alert("Your device does not have Passkey Authentication.")
  }, []);


  const validateEmail = (text) => {
    return true;
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (reg.test(text) === false) return false;
    else return true;
  }

  const loginAnonymousUser = async () => {

    try { 
      setLoading(true);  
      
      let resultAnon = await loginAnonymous();
      console.log(' loginAnonymous resultAnon  ', resultAnon);

      if(resultAnon.error){  
        setErrortext(resultAnon.error.message); 
      }
      else {
        resultAnon.challenge = base64url.toBase64(resultAnon.challenge)

        console.log("sign passkey resultAnon.challenge ", resultAnon.challenge)
        let result = await Passkey.register(resultAnon);
        console.log("sign passkey attResponse ", result)
        
        if(result.id === undefined) {
          setErrortext("invalid biometric data"); 
          return;
        }


        const convertToRegistrationResponse = {
          ...result,
          id: base64url.fromBase64(result.id),
          rawId: base64url.fromBase64(result.rawId),
          response: {
            ...result.response,
            attestationObject: base64url.fromBase64(result.response.attestationObject),
            clientDataJSON: base64url.fromBase64(result.response.clientDataJSON),
            clientExtensionResults: {},
            type: 'public-key',
            email:userEmail
          },
          handle:resultAnon.user.handle
        }
        let authn = await loginAnonymousComplete(convertToRegistrationResponse);

        if(authn.error) setErrortext(`Error: ${authn.error.message}`);
       

      }

    } catch (error) {
      console.log(' loginAnonymous error  ', error);

      setErrortext(error.message); 
    }
    finally{
      setLoading(false);  
    }

  }
  
  const handleSubmitLogin = async () => { 
    setErrortext('');
    if (!userEmail) {
      alert('Please fill Email');
      return;
    }
    if (!validateEmail(userEmail)) {
      alert('Please fill a valid email');
      return;
    }
 
 
    setLoading(true);  

   
    try {
      let result = await login(userEmail); 

      if(result.code && result.message){  
        setErrortext(result.message); 
      }
      else{

        console.log("Passkey login result ", result)

        result.challenge = base64url.toBase64(result.challenge)

        let assertion = await Passkey.authenticate(result)

        console.log("Passkey.authenticate assertion ", assertion)

        if(!assertion.id){
          setErrortext("Invalid Passkey"); 
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
          type: 'public-key',
          handle: userEmail
        }

        let authn = await loginComplete( convertToAuthenticationResponseJSON);
        console.log("loginResult ", authn)
        if(authn.error) setErrortext(`Error: ${authn.error.message}`);
      }

    } catch (error) {
      console.error(error)
      setErrortext(error.message); 
    }
    finally{
      setLoading(false);  
    }
    
       
  };

 
 
  return (
    <View style={styles.mainBody}>
      <Loader loading={loading} />
      
      <ScrollView keyboardShouldPersistTaps="handled">

        <View style={{ marginTop: 100 }}>
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
            <View style={styles.SectionStyle}>
              <TextInput
                style={styles.inputStyle}
                value={userEmail}
                onChangeText={UserEmail => setUserEmail(UserEmail)} 
                placeholder="Enter Email"
                autoCapitalize="none" 
                autoCorrect={false}
                keyboardType="email-address" 
                returnKeyType="next" 
                onSubmitEditing={() => handleSubmitLogin}
                blurOnSubmit={false}
                
              />
            </View> 

            

            {errortext != '' && <Text style={styles.errorTextStyle}> {errortext} </Text>}
            <TouchableOpacity
              style={styles.buttonStyle}
              activeOpacity={0.5}
              onPress={handleSubmitLogin}>
              <Text style={styles.buttonTextStyle}>LOGIN</Text>
            </TouchableOpacity>
            {appData && appData.anonymousLoginEnabled && 
              <TouchableOpacity
                style={styles.buttonStyle}
                activeOpacity={0.5}
                onPress={loginAnonymousUser}>
                <Text style={styles.buttonTextStyle}>LOGIN AS ANONYMOUS</Text>
              </TouchableOpacity> 
            }
            <TouchableOpacity
              style={styles.buttonStyle}
              activeOpacity={0.5}
              onPress={() => props.navigation.navigate('Signup')}>
              <Text style={styles.buttonTextStyle}> SIGNUP</Text>
            </TouchableOpacity> 


          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </View>
  );
};
export default LoginScreen;

const styles = StyleSheet.create({
  mainBody: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  SectionStyle: {
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
});