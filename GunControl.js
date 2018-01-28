/*
    Credit goes to https://github.com/EnforcerZhukov/SelectiveFire/
    This script is just SelectiveFire adapted to GT-MP with some extra features.
*/

var screenMR = API.getScreenResolutionMaintainRatio();
var mapMarginLeft = screenMR.Width / 90;
var mapMarginBottom = screenMR.Height / 86;
var mapWidth = screenMR.Width / 7.11;
var mapHeight = screenMR.Height / 5.71;
var resX = mapMarginLeft + mapWidth + mapMarginLeft;
var resY = screenMR.Height - mapHeight - mapMarginBottom;

var ignoreCurrentWeapon = true;
var safetyEnabled = false;
var firingMode = 0;
var burstShots = 0;
var firingModes = ["AUTO", "BURST", "SINGLE"];
var playerChoices = [];

var burstFireWeapons = [
    584646201, // AP Pistol
    324215364, // Micro SMG
    -619010992, // Machine Pistol
    736523883, // SMG
    -270015777, // Assault SMG
    171789620, // Combat PDW
    -1660422300, // MG
    2144741730, // Combat MG
    1627465347, // Gusenberg
    -1121678507, // Mini SMG
    2024373456, // SMG Mk2
    -608341376, // Combat MG Mk2
    -1074790547, // Assault Rifle
    -2084633992, // Carbine Rifle
    -1357824103, // Advanced Rifle
    -1063057011, // Special Carbine
    2132975508, // Bullpup Rifle
    1649403952, // Compact Rifle
    961495388, // Assault Rifle Mk2
    -86904375, // Carbine Rifle Mk2
    -1768145561, // Special Carbine Mk2
    -2066285827 // Bullpup Rifle Mk2
];

var singleFireDisabledWeapons = [
    -598887786, // Marksman Pistol
    -1045183535, // Revolver
    911657153, // Stun Gun
    1198879012, // Flare Gun
    -1746263880, // Double Action
    -879347409, // Revolver Mk2
    100416529, // Sniper Rifle
    205991906, // Heavy Sniper
    177293209, // Heavy Sniper Mk2
    487013001, // Pump Shotgun
    2017895192, // Sawnoff Shotgun
    -1654528753, // Bullpup Shotgun
    -1466123874, // Musket
    -275439685, // Double Barrel Shotgun
    1432025498, // Pump Shotgun Mk2
    -1312131151, // RPG
    1119849093, // Minigun
    2138347493, // Firework Launcher
    1834241177, // Railgun
    1672152130, // Homing Launcher
    125959754 // Compact Grenade Launcher
];

var ignoredWeaponTypes = [
    -1609580060, // Unarmed
    -728555052, // Melee
    -37788308, // FireExtinguisher
    431593103, // Parachute
    690389602, // Stungun
    1548507267, // Thrown
    1595662460, // PetrolCan
];

function isCurrentWeaponIgnored() {
    return ignoredWeaponTypes.indexOf(API.returnNative("GET_WEAPONTYPE_GROUP", 0, API.getPlayerCurrentWeapon())) != -1;
}

API.onResourceStart.connect(function() {
    API.disableFingerPointing(true);
    ignoreCurrentWeapon = isCurrentWeaponIgnored();
});

API.onPlayerWeaponSwitch.connect(function(oldWeapon) {
    ignoreCurrentWeapon = isCurrentWeaponIgnored();
    burstShots = 0;

    var data = playerChoices.find(w => w.Hash == API.getPlayerCurrentWeapon());
    if (data !== undefined) {
        safetyEnabled = data.Safety;
        firingMode = data.FiringMode;
    } else {
        safetyEnabled = false;
        firingMode = 0;
    }
});

API.onUpdate.connect(function() {
    if (ignoreCurrentWeapon) return;

    if (safetyEnabled)
    {
        API.callNative("DISABLE_PLAYER_FIRING", API.getLocalPlayer(), false);
        API.drawText(firingModes[firingMode] + " (SAFETY ON)", resX + 10, resY + 140, 0.5, 114, 204, 114, 255, 4, 0, true, true, 0);

        if (API.isControlJustPressed(24)) API.playSoundFrontEnd("Faster_Click", "RESPAWN_ONLINE_SOUNDSET");
        return;
    }

    if (firingMode > 0)
    {
        switch (firingMode)
        {
            case 1:
            {
                if (API.isPlayerShooting(API.getLocalPlayer())) burstShots++;
                if (burstShots > 0 && burstShots < 3) API.callNative("_SET_CONTROL_NORMAL", 0, 24, API.f(1));

                if (burstShots == 3)
                {
                    API.callNative("DISABLE_PLAYER_FIRING", API.getLocalPlayer(), false);
                    if (API.isControlJustReleased(24)) burstShots = 0;
                }

                if (API.isPlayerReloading(API.getLocalPlayer())) burstShots = 0;
                break;
            }

            case 2:
            {
                if (API.isControlPressed(24)) API.callNative("DISABLE_PLAYER_FIRING", API.getLocalPlayer(), false);
                break;
            }
        }
    }

    API.drawText(firingModes[firingMode] + " (SAFETY OFF)", resX + 10, resY + 140, 0.5, 224, 50, 50, 255, 4, 0, true, true, 0);
});

API.onKeyDown.connect(function(e, key) {
    if (key.KeyCode == Keys.B)
    {
        if (API.isChatOpen() || isCurrentWeaponIgnored()) return;
        var currentWeapon = API.getPlayerCurrentWeapon();
        var currentFiringMode = firingMode;

        firingMode++;
        if (firingMode > 2) firingMode = 0;

        switch (firingMode)
        {
            // switched to burst fire
            case 1:
                if (burstFireWeapons.indexOf(currentWeapon) == -1) firingMode = (singleFireDisabledWeapons.indexOf(currentWeapon) == -1) ? 2 : 0;
            break;

            // switched to single fire
            case 2:
                if (singleFireDisabledWeapons.indexOf(currentWeapon) > -1) firingMode = 0;
            break;
        }

        if (currentFiringMode != firingMode)
        {
            var data = playerChoices.find(w => w.Hash == currentWeapon);
            if (data !== undefined) {
                var idx = playerChoices.indexOf(data);
                playerChoices[idx].FiringMode = firingMode;
            } else {
                playerChoices.push({ Hash: currentWeapon, Safety: safetyEnabled, FiringMode: firingMode });
            }

            burstShots = 0;
            API.playSoundFrontEnd("Faster_Click", "RESPAWN_ONLINE_SOUNDSET");
        }
    }

    if (key.KeyCode == Keys.F4)
    {
        if (API.isChatOpen() || isCurrentWeaponIgnored()) return;
        var currentWeapon = API.getPlayerCurrentWeapon();
        safetyEnabled = !safetyEnabled;
        burstShots = 0;

        var data = playerChoices.find(w => w.Hash == currentWeapon);
        if (data !== undefined) {
            var idx = playerChoices.indexOf(data);
            playerChoices[idx].Safety = safetyEnabled;
        } else {
            playerChoices.push({ Hash: currentWeapon, Safety: safetyEnabled, FiringMode: firingMode });
        }

        API.playSoundFrontEnd("Faster_Click", "RESPAWN_ONLINE_SOUNDSET");
    }
});