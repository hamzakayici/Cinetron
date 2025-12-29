import React from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { Media } from '../constants/Types';
import TVMediaCard from './TVMediaCard';

interface TVRowProps {
    title: string;
    items: Media[];
}

export default function TVRow({ title, items }: TVRowProps) {
    // Larger cards for TV
    const cardWidth = Platform.isTV ? 280 : 160;

    return (
        <View className="mb-8">
            <Text className="text-white text-2xl font-bold font-sans mb-4 px-12">
                {title}
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 48 }}
                // Enable TV focus navigation
                focusable={false}
            >
                {items.map((item) => (
                    <TVMediaCard 
                        key={item.id} 
                        media={item} 
                        width={cardWidth}
                    />
                ))}
            </ScrollView>
        </View>
    );
}
