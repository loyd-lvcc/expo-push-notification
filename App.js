import React, { Component } from 'react';
import { Text, View, Button, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
export default class App extends Component {
  constructor(props) {
    super(props)

    this.notificationListener = React.createRef();
    this.responseListener = React.createRef();

    this.state = {
      expoPushToken: '',
      notification: false,
    }
  }

  async componentDidMount() {
    let token = await this.registerForPushNotificationsAsync();
    this.setState({ expoPushToken: token });

    this.notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      this.setState({ notification });
    });

    this.responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });
  }

  async componentWillUnmount() {
    Notifications.removeNotificationSubscription(this.notificationListener.current);
    Notifications.removeNotificationSubscription(this.responseListener.current);
  }

  async registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
    } else {
      alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }
  
  // Can use this function below OR use Expo's Push Notification Tool from: https://expo.dev/notifications
  async sendPushNotification(expoPushToken) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: 'Original Title',
      body: 'And here is the body!',
      data: { someData: 'goes here' },
    };
  
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }

  async scheduleNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "You've got mail! 📬",
        body: 'Here is the notification body',
        data: { data: 'goes here' },
      },
      trigger: { seconds: 5 },
    });
  }

  render() {
    let notification = this.state.notification;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
        <Text>Your expo push token: {this.state.expoPushToken}</Text>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text>Title: {notification && notification.request.content.title} </Text>
          <Text>Body: {notification && notification.request.content.body}</Text>
          <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
        </View>
        <Button
          title="Press to Send Notification"
          onPress={async () => {
            await this.sendPushNotification(this.state.expoPushToken);
          }}
        />

        <Button
          title="Notify after 5 seconds"
          onPress={async () => {
            await this.scheduleNotification();
          }}
        />
      </View>
    );
  }
}
