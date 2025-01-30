//
//  AuthContext.js
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

import React, {createContext, useState, useEffect, useRef} from 'react';
import {Config} from '../config/Config';
import uuid from 'react-native-uuid';
import AppKeyWebAuthn from 'appkey-webauthn';

export const AuthContext = createContext();


export function AuthProvider({ children }) {

    const [signToken, setSignToken] = useState();
    const [userTokenData, setUserTokenData] = useState();
    const [userData, setUserData] = useState();
    const [appData, setAppData] = useState();
    const [loading, setLoading] = useState();
    const [appLocales, setAppLocales] = useState([]);
    const [errorRequest, setErrorRequest] = useState();
    const renderRef = useRef(false);
    const appKeyAuth = new AppKeyWebAuthn({appToken: Config.APP_TOKEN, apiUrl:Config.REST_API}).getInstance();

    useEffect(() => {
        setErrorRequest();
        setUserData();
        
        if (renderRef.current === false){
            getApplication();
           
            return () => {
                renderRef.current = true;
                console.log('AuthContext render clean up. ');
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    async function getApplication() {

        setAppLocales(prevItems => {
            return [];
        });

        let app = await apiRequest('app', null, false);

        if(!app.error) {

            setAppData(app);

            app.locales.map( item => {
                let locale = {label: item, value: item};
                setAppLocales(prevItems => {
                    return [locale , ...prevItems];
                });
            });
        }

        return app;

    }

    async function loginAnonymous(){
        let id =  uuid.v4();
        let result = await apiRequest('loginAnonymous', {handle:`ANON_${id}`});
        console.log('loginAnonymous result = ', result);
        return result;
    }

    async function loginAnonymousComplete(authData){

        let result = await apiRequest('loginAnonymousComplete', authData);
        if(result['access-token']){
            setUserTokenData(result['access-token']);
            setUserData(result);
        }

        return result;
    }



    async function login(handle) {
        let result = await apiRequest('login', {handle:handle});
        return result;
    }

    async function loginComplete(assertion){
        let result = await apiRequest('loginComplete', assertion);
        if(result['access-token']){
            setUserTokenData(result['access-token']);
            setUserData(result);
        }
        return result;
    }

    async function socialSignup(token, provider, handle, displayName, locale) {
        let result = await apiRequest('socialSignup', {token:token, provider:provider, handle:handle, displayName:displayName, locale:locale });
        if(result['access-token']){
            setSignToken(null);
            setUserTokenData(result['access-token']);
            setUserData(result);
        }
        return result;
    }

    async function socialLogin(token, provider){
        let result = await apiRequest('socialLogin', {token:token, provider:provider}, false);
        if(result['access-token']){
            setSignToken(null);
            setUserTokenData(result['access-token']);
            setUserData(result);
        }
        return result;
    }


    async function signup(handle, displayName, locale){
        let result = await apiRequest('signup', {handle:handle, displayName:displayName, locale:locale});
        return result;
    }

    async function signupConfirm(authData){
        let result = await apiRequest('signupConfirm', authData);
        if(result['signup-token']) {setSignToken(result['signup-token']);}
        return result;
    }

    async function signupComplete(signupCode){

        let result = await apiRequest('signupComplete', { code:signupCode, signupToken:signToken} );
        if(result['access-token']){
            setSignToken(null);
            setUserTokenData(result['access-token']);
            setUserData(result);
        }
        return result;
    }

    async function setUserName(userName){
        let result = await apiRequest('setUserName', {userName:userName} );
        if(result){
            setUserData({
                ...userData,
                ['userName']: userName,
            });
        }
        return result;
    }


    async function updateProfile(profile){
        let result = await apiRequest('updateProfile', profile);
        if(result['access-token']){
            setUserTokenData(result['access-token']);
            setUserData(result);
        }
        return result;
    }

    async function verify(data){
        let result = await apiRequest('verify', data);
        return result;
    }

    async function verifyComplete(data){
        let result = await apiRequest('verifyComplete', data);
      
        return result;
    }
    
    async function addPasskey(data){
        let result = await apiRequest('addPasskey', data);
        return result;
    }

    async function addPasskeyComplete(attess){
        let result = await apiRequest('addPasskeyComplete', attess);
        if(result['access-token']){
            setUserTokenData(result['access-token']);
            setUserData(result);
        }
        return result;
    }

    async function updatePasskey(keyId, keyName){
        let result = await apiRequest('updatePasskey', {keyId:keyId, keyName:keyName});
        if(result['access-token']){
            setUserTokenData(result['access-token']);
            setUserData(result);
        }
        return result;
    }

    async function removePasskey(keyId){
        let result = await apiRequest('removePasskey', {keyId:keyId});
        if(result['access-token']){
            setUserTokenData(result['access-token']);
            setUserData(result);
        }
        return result;
    }


    async function apiRequest(func, data, showAlert = true) {
        try {
            setLoading(true);

            console.log(`apiRequest funct ${func} data: `, data);
            let result;

            switch (func) {
                case 'app':
                    result = await appKeyAuth.app.getApp();
                    break;

                case 'signup':
                    result = await appKeyAuth.auth.signup(data);
                    break;

                case 'signupConfirm':
                    result = await appKeyAuth.auth.signupConfirm(data.handle, data);
                    break;

                case 'signupComplete':
                    result = await appKeyAuth.auth.signupComplete(data);
                    let user = appKeyAuth.auth.user;
                    console.log('signupComplete user ', user);
                    break;
                case 'login':
                    result = await appKeyAuth.auth.login(data);
                    break;

                case 'loginComplete':
                    result = await appKeyAuth.auth.loginComplete(data.handle, data);
                    break;

                case 'socialLogin':
                    result = await appKeyAuth.auth.socialLogin(data);
                    break;
                case 'socialSignup':
                    result = await appKeyAuth.auth.socialSignup(data);
                    break;
                case 'loginAnonymous':
                    result = await appKeyAuth.auth.loginAnonymous(data);
                    break;
                case 'loginAnonymousComplete':
                    result = await appKeyAuth.auth.loginAnonymousComplete(data.handle, data);
                    break;
                case 'userNameAvailable':
                    result = await appKeyAuth.profile.userNameAvailable(data);
                    break;
                case 'setUserName':
                    result = await appKeyAuth.profile.setUserName(data);
                    break;
                case 'updateProfile':
                    result = await appKeyAuth.profile.updateProfile(data);
                    break;
                case 'verify':
                    result = await appKeyAuth.auth.verify(data);
                    break;
                case 'verifyComplete':
                    result = await appKeyAuth.auth.verifyComplete(data.handle, data);
                    break;

                case 'addPasskey':
                    result = await appKeyAuth.passkey.addPasskey(data);
                    break;
                case 'addPasskeyComplete':
                    result = await appKeyAuth.passkey.addPasskeyComplete(data);
                    break;
                case 'updatePasskey':
                    result = await appKeyAuth.passkey.updatePasskey(data);
                    break;
                case 'removePasskey':
                    result = await appKeyAuth.passkey.removePasskey(data);
                    break;

                default:
                    break;
            }


            console.log('apiRequest result ', result);
            

            if (result && result.code || result.message){
                if(showAlert === true) { setErrorRequest(result); }
                if(result.code === 405) { logout(); }
                return {error:result};
            }
            else{
                return result;
            }

        } catch (error) {

            console.log('apiRequest catch error ', error);

            if(showAlert === true) { setErrorRequest(error); }
            if(error.code === 405) { logout(); }

            return {error:error};
        }
        finally{
            setLoading(false);
        }
    }


    function logout() {
        setUserData();
        setUserTokenData();
        appKeyAuth.auth.logout();
    }



    const validateInput = (value, islogin = true) => {
        if (!value) {return false;}
        else if (islogin && appData.userNamesEnabled) {return true;}
        else if(appData.handleType === 'phone') {return validatePhone(value);}
        else if(appData.handleType === 'email') {return validateEmail(value);}
        else {return true;}
    };


    const validateEmail = (email) => {
        return (email.indexOf('@') > 0 && email.indexOf('.') > 2 &&  email.indexOf('.') < email.length - 1);
    };


    const validatePhone = (phone) => {

        var regex  = /^\+[0-9\s]{8,16}$/;
        let val = phone.match(regex);
        return val;
    };


    const value = {
        validateInput,
        socialLogin,
        socialSignup,
        setUserName,
        login,
        logout,
        signup,
        signupConfirm,
        signupComplete,
        loginAnonymous,
        loginAnonymousComplete,
        loginComplete,
        getApplication,
        updateProfile,
        addPasskey,
        addPasskeyComplete,
        updatePasskey,
        removePasskey,
        verify,
        verifyComplete,
        userData,
        userTokenData,
        appData,
        appLocales,
        errorRequest,
        loading
      };


    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
