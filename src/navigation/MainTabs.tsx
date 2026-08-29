import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ChartLineUp, ListChecks, Target, User } from "phosphor-react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { GoalsScreen } from "../screens/GoalsScreen";
import { CycleScreen } from "../screens/CycleScreen";
import { ProfilScreen } from "../screens/ProfilScreen";
import { colors, fonts } from "../theme/theme";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent400,
        tabBarInactiveTintColor: colors.textMuted45,
        tabBarStyle: {
          backgroundColor: colors.bgTabBar,
          borderTopColor: colors.divider12,
          borderTopWidth: 1,
          height: 99,
          paddingTop: 9,
          paddingBottom: 16,
        },
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 11.5 },
      }}
    >
      <Tab.Screen
        name="Rapport"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Target size={42} color={color} /> }}
      />
      <Tab.Screen
        name="Objectifs"
        component={GoalsScreen}
        options={{ tabBarIcon: ({ color }) => <ListChecks size={42} color={color} /> }}
      />
      <Tab.Screen
        name="Cycle"
        component={CycleScreen}
        options={{ tabBarIcon: ({ color }) => <ChartLineUp size={42} color={color} /> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{ tabBarIcon: ({ color }) => <User size={42} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
