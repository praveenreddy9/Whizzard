import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Screen2 from './Screen2';

const Screen1 = ({navigation}) => {
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('Screen2');
      }}
      style={{backgroundColor: 'red',top:100}}>
      <Text style={{fontSize: 40, color: 'green'}}>Hello 1</Text>
    </TouchableOpacity>
  );
};

export default Screen1;
