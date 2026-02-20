# How to build a project using your own machine?
## consideration
- This documentation is for android envrionment.
- The application was developed using React-Native in Expo environment.

## Requiremetns
For building your project in you own PC, you will need to have set up the proper enviroment for Android.

There are a lot of considerations and these are changing over the time, so I encorage you to consult a tutorial to set up the enviroment correctly.

At least for the development of this application, it was used the set up provided by _android-studio-2021.2.1.16-windows_.

So, in order to avoid compatibility issues, you can set up your environmet using that version of Android studio.


## Building your project
Once you have setup your environment.

Chose a root folder with a short name.

The closer to the root the better

_Why does it import to have a short name for the root folder?_

The reason is becuase compiler tools have limitation in the the length of the path on which they can operate, if my memory serves me correctly, **the max length supported is 255 characters**, which you can extend to the double modifying some configurations in your system.

So, having something like this "C:/build" would be fine.


Continuing with the steps to build your project, open your terminal and follow the next steps:

1. Execute: 
```
    npx expo prebuild --clean
```
This folder will create you the Android folder with all the configurations that your project need.

Note: Configure your project using ***App.json***. Please, as far as possible avoid to modify the files inside of "android folders"

2. Go to android folder
```
    cd ./android
```
This command will move you to the folder where resides the native code. 

3. Execute
```
    ./gradlew assembleRelease
```

This command will start the build. Depending on you computer it will take a while.

npx expo prebuild

npx expo run:android

./gradlew clean

./gradlew assembleRelease

