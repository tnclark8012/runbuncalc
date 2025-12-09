/**
 * Component for configuring field state (terrain, weather, hazards, screens)
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  Label,
  Option,
  Switch,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { WeatherCloudy24Regular } from '@fluentui/react-icons';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Terrain, Weather } from '@smogon/calc/dist/data/interface';
import {
  setCpuSideField,
  setPlayerSideField,
  setTerrain,
  setTrickRoom,
  setWeather,
  SideFieldState,
} from '../store/fieldSlice';
import { RootState } from '../store/store';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    marginBottom: tokens.spacingVerticalS,
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
  },
  fieldRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  sideSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  spikesControl: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  spikesButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  triggerButton: {
    minWidth: '200px',
  },
});

const TERRAINS: (Terrain | undefined)[] = [undefined, 'Electric', 'Grassy', 'Psychic', 'Misty'];
const WEATHERS: (Weather | undefined)[] = [undefined, 'Sun', 'Rain', 'Hail', 'Sand'];

/**
 * FieldStateControl - Dialog for configuring field conditions
 */
export const FieldStateControl: React.FC = () => {
  const styles = useStyles();
  const dispatch = useDispatch();
  const fieldState = useSelector((state: RootState) => state.field);
  const [open, setOpen] = React.useState(false);

  const handleTerrainChange = (_: any, data: { optionValue?: string }) => {
    const terrain = data.optionValue === 'None' ? undefined : (data.optionValue as Terrain);
    dispatch(setTerrain(terrain));
  };

  const handleWeatherChange = (_: any, data: { optionValue?: string }) => {
    const weather = data.optionValue === 'None' ? undefined : (data.optionValue as Weather);
    dispatch(setWeather(weather));
  };

  const handleTrickRoomChange = (_: any, data: { checked: boolean }) => {
    dispatch(setTrickRoom(data.checked));
  };

  const handlePlayerSideChange = (field: Partial<SideFieldState>) => {
    dispatch(setPlayerSideField(field));
  };

  const handleCpuSideChange = (field: Partial<SideFieldState>) => {
    dispatch(setCpuSideField(field));
  };

  const renderSideControls = (
    side: 'player' | 'cpu',
    sideState: SideFieldState,
    onChange: (field: Partial<SideFieldState>) => void
  ) => (
    <div className={styles.sideSection}>
      <div className={styles.sectionTitle}>{side === 'player' ? 'Player Side' : 'CPU Side'}</div>
      
      <div className={styles.fieldRow}>
        <Switch
          label="Light Screen"
          checked={sideState.isLightScreen}
          onChange={(_, data) => onChange({ isLightScreen: data.checked })}
        />
        <Switch
          label="Reflect"
          checked={sideState.isReflect}
          onChange={(_, data) => onChange({ isReflect: data.checked })}
        />
        <Switch
          label="Aurora Veil"
          checked={sideState.isAuroraVeil}
          onChange={(_, data) => onChange({ isAuroraVeil: data.checked })}
        />
        <Switch
          label="Tailwind"
          checked={sideState.isTailwind}
          onChange={(_, data) => onChange({ isTailwind: data.checked })}
        />
        <Switch
          label="Stealth Rocks"
          checked={sideState.isSR}
          onChange={(_, data) => onChange({ isSR: data.checked })}
        />
      </div>

      <div className={styles.spikesControl}>
        <Label>Spikes:</Label>
        <div className={styles.spikesButtons}>
          <Button
            size="small"
            appearance="outline"
            disabled={sideState.spikes === 0}
            onClick={() => onChange({ spikes: Math.max(0, sideState.spikes - 1) })}
          >
            -
          </Button>
          <span style={{ minWidth: '2em', textAlign: 'center', display: 'inline-block' }}>
            {sideState.spikes}
          </span>
          <Button
            size="small"
            appearance="outline"
            disabled={sideState.spikes === 3}
            onClick={() => onChange({ spikes: Math.min(3, sideState.spikes + 1) })}
          >
            +
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button
          appearance="outline"
          icon={<WeatherCloudy24Regular />}
          className={styles.triggerButton}
        >
          Field
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Field</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            {/* Global Field Effects */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Global Effects</div>
              <div className={styles.fieldRow}>
                <Label htmlFor="terrain-dropdown">Terrain</Label>
                <Dropdown
                  id="terrain-dropdown"
                  placeholder="Select terrain"
                  value={fieldState.terrain || 'None'}
                  selectedOptions={[fieldState.terrain || 'None']}
                  onOptionSelect={handleTerrainChange}
                >
                  {TERRAINS.map((terrain) => (
                    <Option key={terrain || 'None'} value={terrain || 'None'}>
                      {terrain || 'None'}
                    </Option>
                  ))}
                </Dropdown>

                <Label htmlFor="weather-dropdown">Weather</Label>
                <Dropdown
                  id="weather-dropdown"
                  placeholder="Select weather"
                  value={fieldState.weather || 'None'}
                  selectedOptions={[fieldState.weather || 'None']}
                  onOptionSelect={handleWeatherChange}
                >
                  {WEATHERS.map((weather) => (
                    <Option key={weather || 'None'} value={weather || 'None'}>
                      {weather || 'None'}
                    </Option>
                  ))}
                </Dropdown>

                <Switch
                  label="Trick Room"
                  checked={fieldState.isTrickRoom}
                  onChange={handleTrickRoomChange}
                />
              </div>
            </div>

            {/* Side-specific Effects */}
            <div className={styles.twoColumn}>
              {renderSideControls('player', fieldState.playerSide, handlePlayerSideChange)}
              {renderSideControls('cpu', fieldState.cpuSide, handleCpuSideChange)}
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary">Done</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
