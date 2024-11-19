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

import React, {createContext, useState, useEffect} from "react"
import {Config} from '../config/Config';   
import uuid from 'react-native-uuid'; 

export const AuthContext = createContext();
  

export function AuthProvider({ children }) {

    const [userTokenData, setUserTokenData] = useState()  
    const [signupToken, setSignupToken] = useState()  
    
    const [userData, setUserData] = useState() 
    const [appData, setAppData] = useState()
    const [appLocales, setAppLocales] = useState([]); 
    const [errorRequest, setErrorRequest] = useState()

    useEffect(() => {
        getApplication();
    }, []);

    async function getApplication() {

        setAppLocales(prevItems => { 
            return [];
        }); 

        let app = await apiRequest("GET", "appuser/app")

        if(!app.error) {

            setAppData(app)

            app.locales.map( item => {
                let locale = {label: item, value: item};
                setAppLocales(prevItems => { 
                    return [locale , ...prevItems];
                });
            })
        }  

        return app
        
    }

    const validateInput = (value, login = true) => {
        if (!value) return false;
        else if (login && appData.userNamesEnabled) return true;
        else if(appData.handleType === "phone") return validatePhone(value);
        else if(appData.handleType === "email") return validateEmail(value);
        else return true;
    }


    const validateEmail = (email) => {
        return (email.indexOf("@") > 0 && email.indexOf(".") > 2 &&  email.indexOf(".") < email.length - 1)
    }


    const validatePhone = (phone) => {
        
        var regex  = /^\+[0-9\s]{8,16}$/;
        let val = phone.match(regex);
        return val;
    }

    async function loginAnonymous(){ 
        let id =  uuid.v4(); 
        let result = await apiRequest("POST", "appuser/loginAnonymous", {handle:`ANON_${id}`})
        return result 
    }

    async function loginAnonymousComplete(authData){ 
      
        let result = await apiRequest("POST", "appuser/loginAnonymousComplete", authData)
        if(result['access-token']){
            setUserTokenData(result['access-token'])
            setUserData(result)
        }

        return result 
    }

    

    async function login(handle) { 
        let result = await apiRequest("POST", "appuser/login", {handle:handle})
        return result 
    }

    async function loginComplete(assertion){
        let result = await apiRequest("POST", "appuser/loginComplete", assertion)
        if(result['access-token']){
            setUserTokenData(result['access-token'])
            setUserData(result)
        }
        return result 
    }


    async function signup(handle, displayName, locale){
        setSignupToken()
        setUserTokenData()

        let result = await apiRequest("POST", "appuser/signup", {handle:handle, displayName:displayName, locale:locale})
        return result 
    }

    async function signupComplete(signupCode){
        let result = await apiRequest("POST", "appuser/signupComplete", {code:signupCode})
        if(result['access-token']){
            setUserTokenData(result['access-token'])
            setSignupToken()
            setUserData(result)
        }
        return result 
    }

    async function signupConfirm(authData){
        let result = await apiRequest("POST", "appuser/signupConfirm", authData)
        if(result['signup-token']) setSignupToken(result['signup-token'])
        return result
    }

    async function updateProfile(profile){
        let result = await apiRequest("POST", "appuser/updateProfile", profile)
        if(result['access-token']){
            setUserTokenData(result['access-token'])
            setUserData(result)
        }
        return result
    }

    async function apiRequest(method, endpoint, params) {
        try {
            let option = {
                method: method || 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                }
            };

            if(userTokenData) option.headers["access-token"] = userTokenData
            else if (signupToken) option.headers["signup-token"] = signupToken
            else option.headers["app-token"] = Config.APP_TOKEN;

            if (method !== "GET" && method !== "DELETE"){
                option.body = JSON.stringify(params)
            } 

            let response = await fetch(`${Config.REST_API}/api/${endpoint}`, option)

          
            let result = await response.json(); 
            console.log(`apiRequest '${endpoint}' - response result `, result)
            
            if (response.status !== 200){ 
                setErrorRequest(result)
                return {error:result}
            } 
            else{
                return result;
            } 

        } catch (error) {
            setErrorRequest(error)
            return {error:error}
        }
    }


    function logout() {
        setUserData();
        setUserTokenData();
    }




    const value = {
        validateInput,
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
        userData,
        userTokenData,
        appData,
        appLocales,
        errorRequest
      }

      
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}