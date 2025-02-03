# How to build a project using eas?

## What is eas? 
Eas is the achronym of **expo application service**, this is a service for building your expo projects and it is from the main supporters
of the expo framework.

They offer you the infrastructure to build your project, in this way you only have to add the proper configuration for build the project as you want


## how to build your project using eas?
### Considerations 
- Your project is developed using expo
- You have an account in eas plataform (if not you will need to create one).

### Adding configurations files
You have to add a file named **_eas.json_**, placed this file in the root of the application.
In this file you will configure how do you want to build your project using the plataform. Here is the configuration that is being used for this twister project:
```
{
  "build": {
    "preview": {
       "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_DEBUG": "true"
      },
      "channel": "preview"
    },
    "preview2": {
      "android": {
        "gradleCommand": ":app:assembleRelease"
      },
      "channel": "preview2"
    },
    "preview3": {
      "developmentClient": true,
      "channel": "preview3"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

Considerations: 

1. Be aware that you need your **app.json**, this file is the configuration of the project itself.
2. If you need environment variables you can add them using an **.env** file. Place this file in the root of the application.
   
   - Consider that eas provides a mechanism to declare environment variables (you declare the variables in plataform so you can use it in all the builds), so it would be worthy to check the documentation if you need extra secruity for your environment variables. 

Once you add you _eas.json_, verify that you don't have the android folder. This folder is created when you pre-build or build your project in your local machine, this is a source of errors when eas tries to compile your project. 

_It is better that the plataform makes its own prebuild instead of you provide one_

Once you have set your file configurations, you have to execute following command:
``` 
eas build -p android --profile preview
```

Nota: You will have to be logged in the plataform if you want to execute the command.
