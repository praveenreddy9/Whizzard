import React, {Component} from 'react';
import {
  View,
  Image,
  Dimensions,
  Modal,
  Linking,
  Text,
  TouchableOpacity,
  ScrollView, Platform,
} from 'react-native';
import Utils from './common/Utils';
import Config from './common/Config';
import {CText, LoadImages, LoadSVG, Styles} from './common';
import {Button, Card} from 'react-native-paper';
import AsyncStorage from '@react-native-community/async-storage';
import axios from 'axios';
import {withNavigation} from 'react-navigation';
import Services from './common/Services';
import DeviceInfo from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import {fetch} from 'react-native/Libraries/Network/fetch';

const appVersionNumber = Config.routes.APP_VERSION_NUMBER;

class AuthNav extends Component {
  constructor(properties) {
    super(properties);
    this.state = {
      InvalidVersionModal: false,
      criticalUpdate: false,
      showAroghyaSetu: false,
      ArogyaSethuList: [
        {name: 'USE MASK AT ALL TIMES'},
        {name: 'SANITIZE REGULARLY'},
        {name: 'WASH HANDS ATLEAST FOR 20 SECS'},
        {name: 'AVOID CONTACT DELIVERY'},
      ],
      updateVersionNumber: appVersionNumber,
    };
  }

  componentDidMount() {
    // this.checkSession();
    this._subscribe = this.props.navigation.addListener('didFocus', () => {
      // this.checkAppIsAvailable()
      // this.checkAppVersion();
      this.checkAppUpdate();
    });
  }

  checkAppIsAvailable() {
    // this.props.navigation.navigate('CalendarShifts')
    this.setState({showAroghyaSetu: true});
  }

  onIds(device) {
    if (device.userId) {
      Utils.setToken('DEVICE_ID', device.userId, function () {});
    }
  }

  //Will hit during launch(if no device id is present)
  // installationId(DEVICE_ID) {
  UpdateMobileDetails() {
    const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_MOBILE_DETAILS;
    const body = JSON.stringify({
      // DEVICE_ID: DEVICE_ID,
      brand: DeviceInfo.getBrand(),
      modal: DeviceInfo.getModel(),
      type: DeviceInfo.getSystemName(),
      getDeviceId: DeviceInfo.getDeviceId(),
    });
    Services.AuthHTTPRequest(
      apiURL,
      'PUT',
      body,
      function (response) {
        if (response) {
          // console.log(" Update MobileDetails response 200", response);
        }
      },
      function (error) {
        console.log(' Update MobileDetails error', error);
      },
    );
  }

  async removeToken() {
    try {
      await AsyncStorage.removeItem('Whizzard:token');
      await AsyncStorage.removeItem('Whizzard:userId');
      this.props.navigation.navigate('Login');
      return true;
    } catch (exception) {
      return false;
    }
  }

  checkAppUpdate() {
    const self = this;
    const apiURL =
      Config.routes.BASE_URL + Config.routes.APP_UPDATE_NUMBER_WITHOUT_TOKEN;
    axios(apiURL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {},
    })
      .then(function (response) {
        // console.log('check App update response======',Platform.OS);
        if (response.status === 200) {
          let responseData = response.data;
          // requireMockLocationCheck
          //criticalUpdate
          Utils.setToken(
            'requireMockLocationCheck',
            JSON.stringify(responseData.requireMockLocationCheck),
            function () {
              // Utils.setToken('requireMockLocationCheck','false', function () {
            },
          );
          if (responseData.appVersion !== appVersionNumber) {
            self.setState({
              InvalidVersionModal: true,
              criticalUpdate: responseData.criticalUpdate,
              updateVersionNumber: responseData.appVersion,
            });
          } else {
            self.checkSession();
          }
        }
      })
      .catch(function (error) {
        // console.log('check App update error', error, error.response);
        // self.props.navigation.navigate('Login');
        if (error.response) {
          if (error.response.status === 403) {
            Utils.dialogBox('Token Expired,Please Login Again', '');
            self.props.navigation.navigate('Login');
          } else {
            Utils.setToken(
              'Error_Message',
              error.response.data.message,
              function () {},
            );
            self.props.navigation.navigate('ErrorsList');
          }
        } else {
          Utils.setToken('Error_Message last', error.message, function () {});
          self.props.navigation.navigate('ErrorsList');
        }
      });
  }

  checkSession() {
    AsyncStorage.getItem('Whizzard:token').then(accessToken => {
      if (accessToken) {
        AsyncStorage.getItem('Whizzard:userStatus').then(userStatus => {
          //ACTIVATED

          if (
            userStatus === 'ACTIVATION_PENDING' ||
            userStatus === 'USER_PROFILE_PENDING'
          ) {
            this.props.navigation.navigate('ProfileStatusScreen');
          } else if (userStatus === 'REJECTED' || userStatus === 'DISABLED') {
            AsyncStorage.clear();
            this.props.navigation.navigate('RejectedUsers');
          } else {
            this.props.navigation.navigate('AppNav');
          }
        });
      } else {
        this.props.navigation.navigate('Login');
      }
    });
  }

  getUserStatus(accessToken) {
    const self = this;
    const apiUrl =
      Config.routes.BASE_URL + Config.routes.USER_STATUS_AND_APP_VERSION;
    const body = '';
    axios(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: accessToken,
      },
      data: body,
    })
      .then(function (response) {
        if (response.status === 200) {
          const data = response.data;
          Utils.setToken('userStatus', data.status, function () {});
          Utils.setToken(
            'userRole',
            JSON.stringify(response.data.role),
            function () {},
          );
          Utils.setToken(
            'profilePicUrl',
            response.data.profilePicUrl,
            function () {},
          );
          Utils.setToken('userId', response.data.userId, function () {});
          if (
            data.status === 'ACTIVATION_PENDING' ||
            data.status === 'USER_PROFILE_PENDING'
          ) {
            self.props.navigation.navigate('ProfileStatusScreen', {
              pendingFields: data.errors.missingFields,
            });
          } else if (data.status === 'REJECTED' || data.status === 'DISABLED') {
            AsyncStorage.clear();
            self.props.navigation.navigate('RejectedUsers');
          } else {
            self.props.navigation.navigate('AppNav');
          }
        }
      })
      .catch(function (error) {
        // console.log('getUser Status error', error, error.response);
        if (error.response) {
          if (error.response.status === 403) {
            Utils.dialogBox('Token Expired,Please Login Again', '');
            self.props.navigation.navigate('Login');
          } else {
            Utils.setToken(
              'Error_Message',
              error.response.data.message,
              function () {},
            );
            self.props.navigation.navigate('ErrorsList');
          }
        } else {
          Utils.setToken('Error_Message last', error.message, function () {});
          self.props.navigation.navigate('ErrorsList');
        }
      });
  }

  async getItem() {
    return await AsyncStorage.getItem('Whizzard:token');
  }

  async getDeviceId() {
    return await AsyncStorage.getItem('Whizzard:DEVICE_ID');
  }

  render() {
    const {ArogyaSethuList, criticalUpdate} = this.state;
    return (
      <View style={[Styles.flex1, Styles.alignCenter]}>
        <Image
          source={LoadImages.splash_screen}
          style={{
            height: Dimensions.get('window').height,
            width: Dimensions.get('window').width,
          }}
        />
        <View style={[Styles.alignCenter, {position: 'absolute'}]}>
          {LoadSVG.splash_icon}
          <Text
            style={[
              Styles.f18,
              Styles.cWhite,
              Styles.ffMbold,
              Styles.mTop30,
              Styles.mBtm10,
            ]}>
            Welcome to
          </Text>
          {LoadSVG.splash_logo}
          {/* MODAL FOR Invalid VERSION Details ALERT */}
          <Modal
            transparent={true}
            visible={this.state.InvalidVersionModal}
            onRequestClose={() => {}}>
            <View
              style={[
                Styles.aitCenter,
                Styles.jCenter,
                {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  top: 0,
                  bottom: 0,
                  flex: 1,
                },
              ]}>
              <View
                style={[
                  Styles.bw1,
                  Styles.bgLGrey,
                  Styles.aslCenter,
                  Styles.br10,
                  {width: Dimensions.get('window').width - 70},
                ]}>
                <Card>
                  <Card.Content>
                    <View style={[Styles.aslCenter, Styles.p5]}>
                      <FastImage
                        source={LoadImages.Loader}
                        style={[Styles.img50, Styles.aslCenter]}
                      />
                      <CText
                        cStyle={[
                          Styles.cBlk,
                          Styles.aslCenter,
                          Styles.f18,
                          Styles.ffMbold,
                        ]}>
                        Please Update Application to the latest Version
                      </CText>
                    </View>
                    <View>
                      <Button
                        style={[
                          Styles.aslCenter,
                          Styles.bgBlue,
                          Styles.padH25,
                          Styles.marV10,
                        ]}
                        mode="contained"
                        onPress={() => {
                          this.setState({InvalidVersionModal: true}, () => {
                            Linking.openURL(
                              'https://play.google.com/store/apps/details?id=com.whizzard&hl=en',
                            );
                          });
                        }}>
                        {/*UPDATE  v{Config.routes.APP_VERSION_NUMBER}*/}
                        UPDATE v{this.state.updateVersionNumber}
                      </Button>
                    </View>
                    {!criticalUpdate ? (
                      <View>
                        <Button
                          style={[
                            Styles.aslCenter,
                            Styles.padH25,
                            Styles.mBtm10,
                          ]}
                          mode="text"
                          onPress={() => {
                            this.setState({InvalidVersionModal: false}, () => {
                              this.checkSession();
                            });
                          }}>
                          Later
                        </Button>
                      </View>
                    ) : null}
                  </Card.Content>
                </Card>
              </View>
            </View>
          </Modal>

          {/* MODAL FOR Aroghya Setu ALERT */}
          <Modal
            transparent={true}
            animated={true}
            animationType="slide"
            visible={this.state.showAroghyaSetu}
            onRequestClose={() => {}}>
            <View style={[Styles.modalfrontPosition]}>
              <View
                style={[
                  Styles.bw1,
                  Styles.bgWhite,
                  Styles.p15,
                  {width: Dimensions.get('window').width - 50},
                ]}>
                <View style={[Styles.aslCenter, Styles.p5, Styles.row]}>
                  {LoadSVG.whizzard_logo}
                  <CText
                    cStyle={[
                      Styles.cRed,
                      Styles.aslCenter,
                      Styles.f16,
                      Styles.ffMbold,
                      Styles.marH10,
                    ]}>
                    STAY SAFE
                  </CText>
                </View>

                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#b2beb5',
                    marginVertical: 5,
                  }}
                />

                <ScrollView
                  style={[{height: Dimensions.get('window').height / 2.7}]}>
                  {ArogyaSethuList.map(function (item, index) {
                    return (
                      <View
                        key={index}
                        style={[
                          Styles.bw1,
                          Styles.bcAsh,
                          {padding: 13},
                          Styles.marV10,
                          Styles.aslCenter,
                          {width: Dimensions.get('window').width - 85},
                        ]}>
                        <Text
                          style={[
                            Styles.f14,
                            Styles.ffMbold,
                            Styles.cBlk,
                            {textAlign: 'center'},
                          ]}>
                          {item.name}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
                <View style={[Styles.aslCenter, Styles.mTop10]}>
                  <Text style={[Styles.ffMbold]}>DOWNLOAD AND RUN</Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    this.setState({showAroghyaSetu: false}, () => {
                      Linking.openURL(
                        'https://play.google.com/store/apps/details?id=nic.goi.aarogyasetu&hl=en_IN',
                      );
                      // this.checkAppVersion();
                      this.checkAppUpdate();
                    })
                  }
                  style={[Styles.bgBlk, Styles.p10, Styles.marV20]}>
                  <Text
                    style={[
                      Styles.aslCenter,
                      Styles.cWhite,
                      Styles.padH10,
                      Styles.padV5,
                      Styles.ffMbold,
                      Styles.f16,
                    ]}>
                    AAROGYA SETU APP
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={{marginTop: 20}}
                onPress={() => {
                  this.setState({showAroghyaSetu: false}, () => {
                    // this.checkAppVersion();
                    this.checkAppUpdate();
                  });
                }}>
                {LoadSVG.cancelIcon}
              </TouchableOpacity>
            </View>
          </Modal>
        </View>
      </View>
    );
  }
}

export default withNavigation(AuthNav);
