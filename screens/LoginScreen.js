 
//
//  LoginScreen.js
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

import React, {useEffect, useState,  useContext } from 'react'; 
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
import * as AppleAuthentication from 'expo-apple-authentication';
import base64url from 'base64url';
import {
  GoogleSignin 
} from '@react-native-google-signin/google-signin';
import { AuthContext } from '../context/AuthContext';
import {Config} from '../config/Config';


const LoginScreen = props => {
  
  let [userHandle, setUserHandle] = useState(''); 
  let [loading, setLoading] = useState(false); 
  let [errorText, setErrorText] = useState(''); 
  let [infoText, setInfoText] = useState(''); 
  const { validateInput, socialSignup, socialLogin, login, loginComplete, loginAnonymous, loginAnonymousComplete, appData} = useContext(AuthContext);
  global.Buffer = require('buffer').Buffer;

  
  useEffect(() => {
    if (!Passkey.isSupported()) alert("Your device does not have Passkey Authentication.")
  }, []);

  useEffect(() => {

    if (appData && appData.googleLoginEnabled){

      GoogleSignin.configure({
        iosClientId: Config.GOOGLE_CLIENT_ID,
      });

    }


  }, [appData]); 


  const loginAnonymousUser = async () => {

    try { 
      setLoading(true);  
      
      let resultAnon = await loginAnonymous();
      console.log(' loginAnonymous resultAnon  ', resultAnon);

      if(resultAnon.error){  
        setErrorText(resultAnon.error.message); 
      }
      else {
        resultAnon.challenge = base64url.toBase64(resultAnon.challenge)

        console.log("sign passkey resultAnon.challenge ", resultAnon.challenge)
        let result = await Passkey.register(resultAnon);
        console.log("sign passkey attResponse ", result)
        
        if(result.id === undefined) {
          setErrorText("invalid biometric data"); 
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
            email:userHandle
          },
          type: 'public-key',
          handle:resultAnon.user.handle
        }
        let authn = await loginAnonymousComplete(convertToRegistrationResponse);

        if(authn.error) setErrorText(`Error: ${authn.error.message}`);
       

      }

    } catch (error) {
      console.log(' loginAnonymous error  ', error);

      setErrorText(error.message); 
    }
    finally{
      setLoading(false);  
    }

  }
  
  const handleSubmitLogin = async () => { 
    setErrorText('');
    
    if (!validateInput(userHandle)) {
      alert('Please fill a valid handle');
      return;
    }
 
 
    setLoading(true);  

   
    try {
      let result = await login(userHandle); 

      if(result.code && result.message){  
        setErrorText(result.message); 
      }
      else{

        console.log("Passkey login result ", result)

        result.challenge = base64url.toBase64(result.challenge)

        let assertion = await Passkey.authenticate(result)

        console.log("Passkey.authenticate assertion ", assertion)

        if(!assertion.id){
          setErrorText("Invalid Passkey"); 
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
          handle: userHandle
        }

        let authn = await loginComplete( convertToAuthenticationResponseJSON);
        console.log("loginResult ", authn)
        if(authn.error) setErrorText(`Error: ${authn.error.message}`);
      }

    } catch (error) {
      console.error(error)
      setErrorText(error.message); 
    }
    finally{
      setLoading(false);  
    }
    
       
  };

  
  async function socialLoginHandler(token, profile, provider) {
    try {
      setLoading(true);

      let result = await socialLogin(token, provider);

      if(result.error){
        if(result.error.code === 603){

          setInfoText('Creating New Account');
          let displayName;
          if(provider === 'apple' ) {
            if(profile.fullName.givenName) {
              displayName = `${profile.fullName.givenName} ${profile.fullName.familyName}`
              socialSignupHandler(token, 'apple', profile.email, displayName);
            }
            else {
              let errorMessage = "App cannot access to your profile name. Please remove this AppKey in 'Sign with Apple' from your icloud setting and try again.";
              setErrorText(`AppKey: ${errorMessage}`);
            }
          }
          else {
            displayName = `${profile.givenName} ${profile.familyName}`
            socialSignupHandler(token, 'google', profile.email, displayName);
          }

        }
        else {
          setErrorText(`AppKey: ${result.error.message}`);
        }
      }

    } catch (error) {
      setErrorText(`Error: ${error.message}`);
    }
    finally{
      setLoading(false);
    }
  }



  async function socialSignupHandler(token, provider, email, displayName, locale) {
    try {
      setLoading(true);
      let result = await socialSignup(token, provider, email, displayName, locale);
      if(result.error) {setErrorText(`Error: ${result.error.message}`);}

    } catch (error) {
      setErrorText(`Error: ${error.message}`);
    }
    finally{
      setLoading(false);
    }



  }

  //https://react-native-google-signin.github.io/docs/setting-up/expo
  const handleAppleLogin = async () => { 
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // signed in
      console.log("handleAppleLogin credential ", credential)
      socialLoginHandler(credential.identityToken, credential, 'apple')
      

    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // handle that the user canceled the sign-in flow
      } else {
        // handle other errors
      }
    }
  }


  async function onGoogleLoginPress() {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type === 'success') {
        console.log(response.data);

        socialLoginHandler(response.data.idToken, response.data.user, 'google');

      } else {
        // sign in was cancelled by user
        setErrorText(`AppKey Google User Response: ${response.type}`);

      }


    } catch (error) {
      console.error('ERROR: ', error);
      setErrorText(`AppKey: ${error.message}`);
      return error;
    }

  }
 
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

            {infoText != '' && <Text style={styles.registerTextStyle}> {infoText} </Text>}

            <View style={styles.SectionStyle}>
              <TextInput
                style={styles.inputStyle}
                value={userHandle}
                onChangeText={value => setUserHandle(value)} 
                placeholder="Enter User Handle"
                autoCapitalize="none" 
                autoCorrect={false}
                keyboardType="email-address" 
                returnKeyType="next" 
                onSubmitEditing={() => handleSubmitLogin}
                blurOnSubmit={false}
                
              />
            </View> 

            

            {errorText != '' && <Text style={styles.errorTextStyle}> {errorText} </Text>}
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

            {appData && appData.appleLoginEnabled && appData.appleBundleId &&
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={5}
                style={styles.buttonStyle}
                onPress={handleAppleLogin}
              />
            }

              {appData && appData.googleLoginEnabled && appData.googleClientId &&
                  <TouchableOpacity
                    style={styles.buttonStyle}
                    activeOpacity={0.5}
                    onPress={onGoogleLoginPress}>
                    <Text style={styles.buttonTextStyle}> Sign In With Google</Text>
                  </TouchableOpacity>
              }

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