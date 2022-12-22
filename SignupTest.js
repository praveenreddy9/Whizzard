import React from 'react';
import {
    Text,
    View,
    Modal,
    TouchableOpacity,
} from 'react-native';

const SignupTest = ({navigation}) => {
    return (
        <TouchableOpacity
            onPress={() => {
                navigation.navigate('Screen1');
            }}
            style={{backgroundColor: 'red',top:100}}>
            <Text style={{fontSize: 40, color: 'green'}}>Hello,Signup Screen</Text>
        </TouchableOpacity>
    );
};

export default SignupTest;

