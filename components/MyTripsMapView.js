import React from 'react';
import {
    Text,
    View,
    Dimensions,
    StyleSheet,
    StatusBar,
    PermissionsAndroid,
    Animated,
    TouchableHighlight
} from 'react-native';
// import MapView, {Marker, Polyline} from 'react-native-maps';
import Services from "./common/Services";
import Config from "./common/Config";
import {Appbar} from "react-native-paper";
import {CSpinner, Styles} from "./common";
import Utils from "./common/Utils";
import OfflineNotice from './common/OfflineNotice';
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import HomeScreen from "./HomeScreen";

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 12.2602;
const LONGITUDE = 77.1461;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;


class MyTripsMapView extends React.Component {
    constructor(props) {
        super(props);
        this.mapRef = null;
        this.state = {
            region: {
                latitude: LATITUDE,
                longitude: LONGITUDE
            },
            coordinates: []
        }
    }

    async requestLocationPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('You can use the Location');
            } else {
                console.log('Location permission denied');
            }
        } catch (err) {
            console.warn(err);
        }
    }

    componentDidMount(){
        this.requestLocationPermission();
        this.setState({shiftId: this.props.navigation.state.params.shiftId});
        this.getGeoLocations();
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    getGeoLocations() {
        const self = this;
        const shiftId = this.props.navigation.state.params.shiftId;
        // const getTrips = Config.routes.BASE_URL + Config.routes.GET_LOCATIONS + shiftId;
        const getTrips = Config.routes.SOCKET_BASE_URL + Config.routes.GET_SHIFT_LOCATIONS + shiftId;
        // const getTrips = 'http://192.168.0.105:5010/api/v1/userLocations/getUserShiftLocations/62c19a0b9a058e49ddd2944c';
        const body = '';
        console.log('map locations',getTrips)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(getTrips, "GET", body, function (response) {
                if (response) {
                    const tripsList = response.data;
                    //tripsList.locations used for JAVA Api
                    //tripsList used for Node Api
                    // console.log("tripsdata locations length", tripsList.length);
                    const coordinates = [];
                    const PolyLine = [];
                    // if (tripsList.locations) {
                    //     const tripsData = tripsList.locations;
                        if (tripsList) {
                        const tripsData = tripsList;
                        if (tripsData.length > 0) {
                            for (let i = 0; i < tripsData.length; i++) {
                                var data = {};
                                data.LatLng = {};
                                let latitude = tripsData[i].latitude;
                                let longitude = tripsData[i].longitude;
                                data.LatLng.latitude = latitude;
                                data.LatLng.longitude = longitude;
                                data.latitude = latitude;
                                data.longitude = longitude;
                                data.id = i;
                                data.title = JSON.stringify(i);
                                if (tripsData[i].createdAt != null) {
                                    data.locationDate = new Date(tripsData[i].createdAt).toDateString();
                                    data.time=Services.returnHMSFromTimeStamp(tripsData[i].createdAt)
                                    // data.time = new Date(tripsData[i].createdAt).getHours() + ":" + new Date(tripsData[i].createdAt).getMinutes()+ ":" + new Date(tripsData[i].createdAt).getSeconds();
                                }
                                coordinates.push(data);
                                var patternData = {};
                                patternData.latitude = tripsData[i].latitude;
                                patternData.longitude = tripsData[i].longitude;
                                PolyLine.push(patternData)
                            }
                            // console.log('coordinates', coordinates);

                            self.setState({
                                showMaps: true,
                                coordinates: coordinates,
                                PolyLine: PolyLine,
                                spinnerBool: false,
                                LATITUDE: coordinates[0].LatLng.latitude,
                                LONGITUDE: coordinates[0].LatLng.longitude,
                                LAST_INDEX: tripsData.length - 1
                            })
                        }else {
                            Utils.dialogBox('No location data found', '');
                            self.setState({
                                showMaps: false,
                                coordinates: coordinates,
                                spinnerBool: false
                            })
                        }
                    } else {
                        Utils.dialogBox('No location data found', '');
                        self.setState({
                            showMaps: false,
                            coordinates: coordinates,
                            spinnerBool: false
                        })
                    }
                }
            }, function (error) {
                self.errorHandling(error)
            });
        })
    }

    errorHandling(error) {
        console.log("trip view error", error, error.response);
        const self = this;
        if (error.response) {
            if (error.response.status === 403) {
                self.setState({spinnerBool: false});
                Utils.dialogBox("Token Expired,Please Login Again", '');
                self.props.navigation.navigate('Login');
            } else if (error.response.status === 500) {
                self.setState({spinnerBool: false});
                if (error.response.data.message) {
                    Utils.dialogBox(error.response.data.message, '');
                } else {
                    Utils.dialogBox(error.response.data[0], '');
                }
            } else if (error.response.status === 400) {
                self.setState({spinnerBool: false});
                if (error.response.data.message) {
                    Utils.dialogBox(error.response.data.message, '');
                } else {
                    Utils.dialogBox(error.response.data[0], '');
                }
            } else if (error.response.status === 413) {
                self.setState({spinnerBool: false}, () => {
                    Utils.dialogBox('Request Entity Too Large', '');
                })
            } else if (error.response.status === 404) {
                self.setState({spinnerBool: false}, () => {
                    Utils.dialogBox(error.response.data.error, '');
                })
            } else {
                self.setState({spinnerBool: false});
                Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }

    onMapLayout = () => {
        this.mapRef.fitToCoordinates(this.state.coordinates, {
            edgePadding: {top: 50, right: 10, bottom: 10, left: 10},
            animated: true
        })
    }

    render() {
        return (
            <View style={[Styles.flex1]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                    <Appbar.Header style={[Styles.bgDarkRed]}>
                        <Appbar.BackAction onPress={() => {
                            this.props.navigation.goBack()
                        }}/>
                        <Appbar.Content title="Trip View" subtitle=""/>
                        <Appbar.Action icon="autorenew" onPress={() => {
                            this.getGeoLocations()
                        }}/>
                    </Appbar.Header>
                {
                    this.state.coordinates.length > 0 ?
                        <View style={[Styles.flex1]}>
                            <Text>HELLO</Text>
                        </View>
                        :
                        <View style={[Styles.flex1, Styles.bgWhite, {justifyContent: 'center', alignSelf: 'center'}]}>
                            <MaterialIcons
                                style={[Styles.aslCenter, Styles.m10,Styles.ffMbold]}
                                name="location-off" size={130} color="#000"/>
                            <Text style={[Styles.ffMbold,Styles.p10,Styles.f20,Styles.cBlk]}>No
                                Locations Found</Text>
                        </View>
                }
            </View>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        // ...StyleSheet.absoluteFillObject,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 60,
        bottom: 0,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },

    bubble: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginVertical: 20,
        backgroundColor: 'transparent',
    },
});

export default MyTripsMapView;
