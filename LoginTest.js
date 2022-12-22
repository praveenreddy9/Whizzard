import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
    KeyboardAvoidingView,
    ScrollView,
    TouchableOpacity,
    Keyboard,
    NativeModules,
    PermissionsAndroid,
    Alert,
} from 'react-native';
let LocationService = NativeModules.LocationService; //LOCATIONS SERIVCES CALL

const LoginTest = ({navigation}) => {
    return (
        <TouchableOpacity
            onPress={() => {
                navigation.navigate('SignupTest');
            }}
            style={{backgroundColor: 'red',top:100}}>
            <Text style={{fontSize: 40, color: 'green'}}>Hello,Login Screen</Text>
        </TouchableOpacity>
    );
};

export default LoginTest;
