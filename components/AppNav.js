
//
//  AppNav.js
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


import React, { useContext, useEffect} from 'react'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Loader from '../components/Loader';
import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen'; 
import ProfileScreen from '../screens/ProfileScreen';
import { AuthContext } from '../context/AuthContext';
import PasskeyScreen from '../screens/PasskeyScreen';
 

const Stack = createNativeStackNavigator();


export default function AppNav() {
  
    const {loading, userTokenData, errorRequest } = useContext(AuthContext);

    useEffect(() => {
      if(errorRequest && errorRequest.message)  alert(errorRequest.message);
  }, [errorRequest]);

    return (
        <NavigationContainer>
           <Loader loading={loading} />
            {userTokenData ? 
                <AppStack/> : 
                <AuthStack/>
            }
        </NavigationContainer>

    )
}


const AuthStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} /> 
      </Stack.Navigator>
    );
  };

  const AppStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen name="Profile" component={ProfileScreen}/> 
        <Stack.Screen name="Passkey" component={PasskeyScreen}/> 
      </Stack.Navigator>
    );
  };