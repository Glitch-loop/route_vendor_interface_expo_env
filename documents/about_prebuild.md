# Prebuild

## What is this?
A prebuild is a build on which you generate native code but not the executable ***".aab"*** or ***".apk"***.

### What is used for?
This is used to test your application using native modules. 

For instance, in this project we use `react-native-bluetooth-classic` to connect the application with the printer, if you try to run the application using `npx expo start` (this will launch Metro and the expo dev server, that means you'll develop in an entirely expo environment, that in short, it's an abstraction of `android`/`ios` environment), in this environment, `react-native-bluetooth-classic` is not going work because it depends on ***native modules***, this can be solved creating a ***prebuild***.

Once you compiled the prebuild you can use it, you'll notice that in the root, folder(s) will be created:

![alt text](image.png)

And **ios** for IPhone develoment.

Inside the folder, native code will be created (an by extenstion the native depedencies), you can use this for continuing developing your application these ***native modules***. 

If you try, you will realize that the module will work.

## Comands
For making a prebuild the application

```
npx expo prebuild
```

For running the prebuild
```
npx expo run:android
```