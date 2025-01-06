# How to build a project using your own machine?
## considerations
- This documentation is for android envrionment.
- The application was developed using React-Native using Expo environment.

## Requiremetns
For building your project in your PC, you will need to have set up the proper enviroment for Android.

There are a lot of steps and these are changing over the time, so I encorage you to consult a tutorial to set up the enviroment correctly.

At least for the development of this application, it was used the set up provided by _android-studio-2021.2.1.16-windows_.

So, in order to avoid compatibility issues, you can set up your environmet using that version of Android studio.


## Run the project using the pre-build
### Why do I want to run the pre-compile before assmebling the application?
For testing purposes you can run your application before compiling it. You can make it through the expo environment.

Although this running is not equivalent to build the project and the the ".apk", running  the pre-compile will give you a better idea of how will behave the application once it gets assemble.

### How to do it?
You must follow the next steps:

1. Execute: 
```
npx expo prebuild --clean
```
This folder will create the Android folder with all the configurations that your project need.

Note: Configure your project using ***App.json***. Please, as far as possible avoid to modify the files inside of "android folders" (modifying them are a source of problems)

Note: The band "--clean" helps you to clean the cache related to the project and create all the folder again.

2. Execute:
```
npx expo run:android
```

This command will execute the project using the pre-compiling of the project.

## Building your project
Once you have setup your environment.

Chose a root folder with a short name. The closer to the root the better.

_Why does it import to have a short name for the root folder?_

The reason is becuase compiler tools have limitations in the the length of the path on which they can operate, if my memory serves me correctly, **the max length supported is 255 characters**, which you can extend to the double modifying some configurations in your system.

So, having something like this "C:/build" would be fine.


Continuing with the steps to build your project, open your terminal and follow the next steps:

1. Execute: 
```
npx expo prebuild --clean
```
This folder will create the Android folder with all the configurations that your project need.

Note: Configure your project using ***App.json***. Please, as far as possible avoid to modify the files inside of "android folders" (modifying them are a source of problems)

Note: The band "--clean" helps you to clean the cache related to the project and create all the folder again.

2. Go to android folder
```
cd ./android
```
This command will move you to the folder where resides the native code. 

3. Execute
```
./gradlew assembleRelease
```

Nota: If you see that the compiler is failing in create the build, you can try to clean the gradled environment and then try to assamble again the project.
```
./gradlew clean
```

Assembling process might last from minutes to hours all the depends on the size of the project or the power that your device has.


## Once the build has finished, what is next?

To get the build of your application you have to move to the folder of the outputs of android:
```
cd ./android/app/build/outputs
```

Once you are in the directory, you will see the file with the extension ".apk". Generally, the file has as name: "app-release".

Notice that depending on the configuration of the compiler, it might generate you another ".apk", the name of this other file will suggest that it is for testing purposes (and indeed it is for that).