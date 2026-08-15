import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function EmergencyWidget() {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#08111F',
        borderRadius: 28,
        padding: 12,
        flexDirection: 'column',
      }}
    >
      {/* =========================================
          GLASS HEADER
      ========================================= */}

      <FlexWidget
        style={{
          height: 54,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
          marginBottom: 10,
          backgroundColor: '#101C2D',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#263A52',
        }}
      >
        {/* CrashCue Branding */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <FlexWidget
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: '#151F31',
              borderWidth: 1,
              borderColor: '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <TextWidget
              text="C"
              style={{
                fontSize: 18,
                color: '#FF3347',
                fontWeight: 'bold',
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              flexDirection: 'column',
            }}
          >
            <TextWidget
              text="CrashCue+"
              style={{
                fontSize: 16,
                color: '#FFFFFF',
                fontWeight: 'bold',
              }}
            />

            <TextWidget
              text="DRIVER SAFETY"
              style={{
                fontSize: 7,
                color: '#7F91A8',
                fontWeight: 'bold',
                marginTop: 1,
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* Ready Indicator */}
        <FlexWidget
          style={{
            height: 30,
            paddingHorizontal: 11,
            borderRadius: 16,
            backgroundColor: '#102A28',
            borderWidth: 1,
            borderColor: '#175B4C',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text="●"
            style={{
              fontSize: 10,
              color: '#34D399',
              marginRight: 5,
            }}
          />

          <TextWidget
            text="READY"
            style={{
              fontSize: 9,
              color: '#34D399',
              fontWeight: 'bold',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* =========================================
          MAIN GLASS AREA
      ========================================= */}

      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'row',
        }}
      >
        {/* =====================================
            EMERGENCY BUTTON
        ===================================== */}

        <FlexWidget
          clickAction="SOS"
          clickActionData={{
            action: 'trigger_sos',
          }}
          style={{
            flex: 1,
            marginRight: 5,
            borderRadius: 25,
            backgroundColor: '#40131A',
            borderWidth: 1,
            borderColor: '#FF394C',
            padding: 8,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          {/* Inner Glass Layer */}
          <FlexWidget
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#5A1720',
              borderWidth: 1,
              borderColor: '#FF6472',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <TextWidget
              text="🚨"
              style={{
                fontSize: 32,
              }}
            />
          </FlexWidget>

          <TextWidget
            text="EMERGENCY"
            style={{
              fontSize: 13,
              color: '#FFFFFF',
              fontWeight: 'bold',
            }}
          />

          <TextWidget
            text="SEND SOS"
            style={{
              fontSize: 9,
              color: '#FF6B78',
              fontWeight: 'bold',
              marginTop: 5,
            }}
          />

          {/* Bottom Glass Highlight */}
          <FlexWidget
            style={{
              height: 5,
              width: 55,
              borderRadius: 5,
              backgroundColor: '#FF394C',
              marginTop: 10,
            }}
          />
        </FlexWidget>

        {/* =====================================
            SAFE BUTTON
        ===================================== */}

        <FlexWidget
          clickAction="SAFE"
          clickActionData={{
            action: 'mark_safe',
          }}
          style={{
            flex: 1,
            marginLeft: 5,
            borderRadius: 25,
            backgroundColor: '#0D382C',
            borderWidth: 1,
            borderColor: '#19D889',
            padding: 8,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          {/* Inner Glass Layer */}
          <FlexWidget
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#104D3A',
              borderWidth: 1,
              borderColor: '#45E8A4',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <TextWidget
              text="✓"
              style={{
                fontSize: 38,
                color: '#FFFFFF',
                fontWeight: 'bold',
              }}
            />
          </FlexWidget>

          <TextWidget
            text="I AM SAFE"
            style={{
              fontSize: 13,
              color: '#FFFFFF',
              fontWeight: 'bold',
            }}
          />

          <TextWidget
            text="CANCEL ALERT"
            style={{
              fontSize: 9,
              color: '#45E8A4',
              fontWeight: 'bold',
              marginTop: 5,
            }}
          />

          {/* Bottom Glass Highlight */}
          <FlexWidget
            style={{
              height: 5,
              width: 55,
              borderRadius: 5,
              backgroundColor: '#19D889',
              marginTop: 10,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
