 
//
//  ProfileScreen.js
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

import React, { useEffect, useState, useContext } from 'react'; 
import {
  StyleSheet, 
  Switch,
  View,
  Text,
  TextInput,
  TouchableOpacity
 
} from 'react-native'; 
 

import Loader from '../components/Loader'; 
 
import { AuthContext } from '../context/AuthContext';
import { Dropdown } from 'react-native-element-dropdown';
//https://www.npmjs.com/package/react-native-element-dropdown

const ProfileScreen = props => { 
  let [loading, setLoading] = useState(false); 
  let [displayName, setDisplayName] = useState(''); 
  let [userLocale, setLocale] = useState('EN');
  let [errortext, setErrortext] = useState('');

  const { userData, appLocales, logout, updateProfile } = useContext(AuthContext);
  
  useEffect(() => {
    if(userData !== undefined){
      setDisplayName(userData.displayName)
      setLocale(userData.locale)
    }
  }, [userData]);


  const setUserLocale = (locale) => {

    console.log('setUserLocale locale ', locale);

    if (locale == userLocale) {
      return;
    }
     
  }

  const handleUpdateProfile = () => {

    if (!displayName) {
      alert('Please fill display name');
      return;
    } 

    setLoading(true)

    let result = updateProfile({displayName:displayName})
    
    if(result.error) setErrortext(`Error: ${result.error.message}`);
    setLoading(false)
  } 

  const logoutHandler = () => { 
    logout()
  } 

  return (
    <View style={styles.mainBody}>
      <Loader loading={loading} />  
    {userData &&  
      <View>
        <Text style={styles.titileTextStyle}>Welcome: {userData.displayName}</Text>   
        <Text style={styles.bodyTextStyle}>Handle: {userData.handle}</Text>  
      </View>
    }
      <View style={styles.SectionStyle}>
      
            <TextInput
              style={styles.inputStyle}
              onChangeText={value => setDisplayName(value)} 
              placeholder="Display Name"
              autoCapitalize="none" 
              autoCorrect={false} 
              returnKeyType="next"  
              value={displayName}
              blurOnSubmit={false}
              
            />
      </View>
 

      {appLocales && appLocales.length > 1 &&
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
      }
      
      {errortext != '' && <Text style={styles.errorTextStyle}> {errortext} </Text>}

      <View style={styles.viewSection}>

        <View style={styles.SectionStyle}>
          <TouchableOpacity
            style={styles.buttonStyle}
            activeOpacity={0.5}
            onPress={handleUpdateProfile}>
            <Text style={styles.buttonTextStyle}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.SectionStyle}>
          <TouchableOpacity
            style={styles.buttonStyleRed}
            activeOpacity={0.5}
            onPress={logoutHandler}>
            <Text style={styles.buttonTextStyle}>Logout</Text>
          </TouchableOpacity>
        </View>

      </View>

      

      
    </View>
  );
};
export default ProfileScreen;

const styles = StyleSheet.create({
  mainBody: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  
  viewSection: {  
    marginTop: 20, 
    marginBottom: 20,
    alignItems: "center",
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
  dropdown: {
    margin: 16,
    height: 50,
    width: 150,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});