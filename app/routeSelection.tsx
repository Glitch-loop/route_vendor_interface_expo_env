import { Link } from "expo-router";
import { View, Text } from "react-native";
import tw from 'twrnc';

export default function routeSelection() {
    return (
        <View>
            <View style={tw`w-full flex flex-row justify-center items-center`}>
                <Text >This is routeSelection</Text>
            </View>
            <Link href="/login">
                <Text>Go to login</Text>
            </Link>
        </View>
    )
}