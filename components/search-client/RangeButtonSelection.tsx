// Libraries
import React from 'react';
import { View, Text } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import tw from 'twrnc';

interface RangeButtonSelectionProps {
    value: number;
    onValueChange: (value: number) => void;
    label?: string;
    ranges?: Array<{ value: number; label: string }>;
}

const RangeButtonSelection: React.FC<RangeButtonSelectionProps> = ({
    value,
    onValueChange,
    label = 'Rango de búsqueda:',
    ranges = [
        { value: 100, label: '100m' },
        { value: 300, label: '300m' },
        { value: 500, label: '500m' },
        { value: 1000, label: '1km' },
    ]
}) => {
    const handleChange = (selectedValue: string) => {
        onValueChange(parseInt(selectedValue));
    };

    return (
        <View style={tw`w-full`}>
            {label && (
                <Text style={tw`text-sm text-gray-600 mb-2`}>{label}</Text>
            )}
            <SegmentedButtons
                value={value.toString()}
                onValueChange={handleChange}
                buttons={ranges.map(range => ({
                    value: range.value.toString(),
                    label: range.label
                }))}
            />
        </View>
    );
};

export default RangeButtonSelection;
