import { useControls } from "leva";
// import { useGameStore } from "@/store/useGameStore"; // Adapte le chemin
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";
import type { JSX } from "react";
import { RigidBody, CoefficientCombineRule } from "@react-three/rapier";
import Flipper from "@/components/pinball/Flipper";
import Kickback from "@/components/pinball/Kickback";
import Slingshot from "@/components/pinball/Slingshot";
import Bumper from "@/components/pinball/Bumper";
import Ball from "@/components/pinball/Ball";
import LauncherGate from "@/components/pinball/LauncherGate";
import DeathZone from "@/components/pinball/DeathZone";
import GoldMine from "@/components/pinball/GoldMine";
import ScoreTarget from "@/components/pinball/ScoreTarget";
import HoleSensor from "@/components/pinball/HoleSensor";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";

type GLTFResult = GLTF & {
  nodes: {
    screws_LOD0: THREE.Mesh;
    screws_LOD0_1: THREE.Mesh;
    visual_obj_flipper_left_bottom: THREE.Mesh;
    visual_obj_flipper_right_bottom: THREE.Mesh;
    visual_obj_gate_5: THREE.Mesh;
    visual_sidewalls: THREE.Mesh;
    visual_right_kickback_door: THREE.Mesh;
    holes_nocoll_LOD0: THREE.Mesh;
    holes_nocoll_LOD0_1: THREE.Mesh;
    visual_ball_rollover: THREE.Mesh;
    visual_bonus_05: THREE.Mesh;
    visual_bonus_01: THREE.Mesh;
    visual_bonus_02: THREE.Mesh;
    visual_bonus_03: THREE.Mesh;
    visual_bonus_04: THREE.Mesh;
    posts_outlane_LOD0: THREE.Mesh;
    posts_outlane_LOD0_1: THREE.Mesh;
    visual_plunger: THREE.Mesh;
    visual_left_hole_ramp: THREE.Mesh;
    visual_left_kickback_door: THREE.Mesh;
    visual_playfield_left_hole: THREE.Mesh;
    visual_holding_flag: THREE.Mesh;
    visual_screws_slingshots: THREE.Mesh;
    visual_super_rubber: THREE.Mesh;
    visual_screws_13002: THREE.Mesh;
    visual_sidewalls001: THREE.Mesh;
    visual_overlap_bottom_3002: THREE.Mesh;
    visual_standard: THREE.Mesh;
    visual_ramp_back_test001: THREE.Mesh;
    visual_standard_collision_sidewalls_back001: THREE.Mesh;
    visual_habit_right_9_top: THREE.Mesh;
    visual_habit_right_left_9_top002: THREE.Mesh;
    visual_barrel_bumpers003: THREE.Mesh;
    visual_rollover_top_1001: THREE.Mesh;
    visual_rollover_top_2001: THREE.Mesh;
    visual_rollover_top_3001: THREE.Mesh;
    mpf_metal_wires_LOD0001: THREE.Mesh;
    mpf_metal_wires_LOD0001_1: THREE.Mesh;
    visual_barrel_bumpers001: THREE.Mesh;
    visual_barrel_bumpers002: THREE.Mesh;
    visual_habit_vuk: THREE.Mesh;
    visual_base_habit_vuk: THREE.Mesh;
    visual_hight_playfield: THREE.Mesh;
    visual_faquir_plank001: THREE.Mesh;
    visual_faquir_plank002: THREE.Mesh;
    visual_faquir_plank003: THREE.Mesh;
    visual_faquir_plank004: THREE.Mesh;
    visual_faquir_plank005: THREE.Mesh;
    visual_faquir_plank006: THREE.Mesh;
    visual_faquir_plank007: THREE.Mesh;
    visual_faquir_plank008: THREE.Mesh;
    visual_faquir: THREE.Mesh;
    light1_Lamp_0: THREE.Mesh;
    light1_Lamp_0_1: THREE.Mesh;
    light1_Lamp_0_2: THREE.Mesh;
    visual_mine_plank001: THREE.Mesh;
    visual_mine_plank002: THREE.Mesh;
    visual_mine_plank003: THREE.Mesh;
    visual_ruby002: THREE.Mesh;
    visual_ruby003: THREE.Mesh;
    visual_ruby001: THREE.Mesh;
    coll_flipper_left_bottom: THREE.Mesh;
    coll_flipper_right_bottom: THREE.Mesh;
    coll_gate: THREE.Mesh;
    coll_metal: THREE.Mesh;
    coll_ramp_metal: THREE.Mesh;
    coll_left_hole_sidewalls: THREE.Mesh;
    coll_left_kickback_door: THREE.Mesh;
    coll_posts_outlane: THREE.Mesh;
    coll_left_hole: THREE.Mesh;
    coll_left_sling_collision: THREE.Mesh;
    coll_right_sling_collision: THREE.Mesh;
    coll_super_rubber: THREE.Mesh;
    coll_standard_collision: THREE.Mesh;
    coll_rubber: THREE.Mesh;
    coll_standard_collision_sidewalls_back: THREE.Mesh;
    coll_playfield_collision_left_hole: THREE.Mesh;
    coll_ramp_back_test: THREE.Mesh;
    coll_scoop_hole_left: THREE.Mesh;
    coll_visual_habit_right_9_top: THREE.Mesh;
    coll_visual_habit_right_left_9_top002: THREE.Mesh;
    coll_right_kickback_door001: THREE.Mesh;
    coll_visual_mpf_metal_wires_11: THREE.Mesh;
    coll_bumpers001: THREE.Mesh;
    coll_bumpers002: THREE.Mesh;
    coll_bumpers003: THREE.Mesh;
    coll_habit_vuk: THREE.Mesh;
    coll_sidewalls001: THREE.Mesh;
    coll_faquir: THREE.Mesh;
    coll_hight_playfield: THREE.Mesh;
    coll_faquir_plank001: THREE.Mesh;
    coll_faquir_plank003: THREE.Mesh;
    coll_faquir_plank002: THREE.Mesh;
    coll_faquir_plank004: THREE.Mesh;
    coll_faquir_plank005: THREE.Mesh;
    coll_faquir_plank006: THREE.Mesh;
    coll_faquir_plank007: THREE.Mesh;
    coll_faquir_plank008: THREE.Mesh;
    coll_mine_gate: THREE.Mesh;
    coll_sidewalls002: THREE.Mesh;
    coll_faquir_glass_panel001: THREE.Mesh;
    visual_Tower_Brick_MT_0: THREE.Mesh;
    visual_Tower_Details_MT_0: THREE.Mesh;
    visual_Tower_Glass_MT_0: THREE.Mesh;
    visual_Tower_Plaster_MT_0: THREE.Mesh;
    visual_Tower_Roof_MT_0: THREE.Mesh;
    coll_glass_panel001: THREE.Mesh;
  };
  materials: {
    M_flipper_arm_left: THREE.MeshStandardMaterial;
    M_flipper_arm_right: THREE.MeshStandardMaterial;
    PaletteMaterial001: THREE.MeshStandardMaterial;
    ["M_playfield_cutout.001"]: THREE.MeshStandardMaterial;
    M_black: THREE.MeshStandardMaterial;
    rubber: THREE.MeshStandardMaterial;
    playfield: THREE.MeshStandardMaterial;
    Brick2: THREE.MeshStandardMaterial;
    ["barrel.001"]: THREE.MeshStandardMaterial;
    Brick3: THREE.MeshStandardMaterial;
    Brick4: THREE.MeshStandardMaterial;
    rock_01: THREE.MeshStandardMaterial;
    plywood: THREE.MeshStandardMaterial;
    PaletteMaterial003: THREE.MeshStandardMaterial;
    Brick_MT: THREE.MeshStandardMaterial;
    Details_MT: THREE.MeshStandardMaterial;
    PaletteMaterial002: THREE.MeshPhysicalMaterial;
    Plaster_MT: THREE.MeshStandardMaterial;
    Roof_MT: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

export default function Model(props: JSX.IntrinsicElements["group"]) {
  const { nodes, materials } = useGLTF(
    "/models/PinballMVP_Base-transformed.glb",
  ) as unknown as GLTFResult;

  // On récupère juste la fonction startGame (temporairement pour nos tests Leva)
  // const startGame = useGameStore((state) => state.startGame);

  // On garde Leva pour ajuster la position de départ
  const { startX, startY, startZ } = useControls("Ball Position", {
    startX: { value: 12.75, min: -20, max: 20, step: 0.1 },
    startY: { value: -2.3, min: -20, max: 20, step: 0.1 },
    startZ: { value: 30.46, min: -40, max: 80, step: 0.1 },
  });
  const { leftStrength, rightStrength } = useControls("Kickbacks", {
    leftStrength: { value: 120, min: 0, max: 200, step: 1 },
    rightStrength: { value: 120, min: 0, max: 200, step: 1 },
  });
  // useControls("Game Controls", {
  //   "Démarrer Partie": button(() => startGame()),
  // });
  return (
    <>
      <GoldMine nodes={nodes} materials={materials} />
      <LauncherGate nodes={nodes} materials={materials} />
      <Ball position={[startX, startY, startZ]} />
      <DeathZone />

      {/* Sensor pour le trou */}
      <HoleSensor
        id="MainHole"
        config={SOUNDS_CONFIG.hole.enter}
        defaultPos={[-1.1, -2.2, 31.8]}
        defaultRot={[1.5, 0, 0]}
        defaultSize={[2.5, 1.3]}
      />

      <Bumper
        id={0}
        colliderGeometry={nodes.coll_bumpers001.geometry}
        visualGeometry={nodes.visual_barrel_bumpers001.geometry}
        visualMaterial={materials["barrel.001"]}
        rubyGeometry={nodes.visual_ruby001.geometry} // Rubis correspondant
        rubyMaterial={materials.PaletteMaterial003}
        position={[1.112, -1.6, -11.134]}
        strength={20}
      />
      <Bumper
        id={1}
        colliderGeometry={nodes.coll_bumpers002.geometry}
        visualGeometry={nodes.visual_barrel_bumpers002.geometry}
        visualMaterial={materials["barrel.001"]}
        rubyGeometry={nodes.visual_ruby002.geometry} // Rubis correspondant
        rubyMaterial={materials.PaletteMaterial003}
        position={[-4.744, -1.6, -6.463]}
        strength={20}
      />
      <Bumper
        id={2}
        colliderGeometry={nodes.coll_bumpers003.geometry}
        visualGeometry={nodes.visual_barrel_bumpers003.geometry}
        visualMaterial={materials["barrel.001"]}
        rubyGeometry={nodes.visual_ruby003.geometry} // Rubis correspondant
        rubyMaterial={materials.PaletteMaterial003}
        position={[-6.635, -1.6, -12.845]}
        strength={20}
      />
      {/* Slingshots */}
      {/* Left Slingshot */}
      <Slingshot
        geometry={nodes.coll_left_sling_collision.geometry}
        position={[-7.708, -2.233, 16.596]}
        rotation={[0, 0, 0]}
        pushDirection={[1, 0, -1]}
      />
      {/* Le droit renvoie la bille vers la gauche (-X) et vers le haut (-Z) */}
      {/* Right Slingshot */}
      <Slingshot
        geometry={nodes.coll_right_sling_collision.geometry}
        position={[5.493, -2.185, 16.596]}
        rotation={[0, 0, 0]}
        pushDirection={[-1, 0, -1]}
      />

      {/* Flippers */}
      {/* --- LEFT FLIPPER --- */}
      <Flipper
        side="left"
        position={[-5.001, -2.901, 26.34]}
        rotation={[0, 0, 0]}
        colliderGeometry={nodes.coll_flipper_left_bottom.geometry}
        visualGeometry={nodes.visual_obj_flipper_left_bottom.geometry}
        visualMaterial={materials.M_flipper_arm_left}
      />
      {/* --- RIGHT FLIPPER --- */}
      <Flipper
        side="right"
        position={[2.787, -2.901, 26.34]}
        rotation={[0, 0, 0]}
        colliderGeometry={nodes.coll_flipper_right_bottom.geometry}
        visualGeometry={nodes.visual_obj_flipper_right_bottom.geometry}
        visualMaterial={materials.M_flipper_arm_right}
      />
      {/* --- KICKBACK GAUCHE --- */}
      <Kickback
        side="left"
        visualGeometry={nodes.visual_left_kickback_door.geometry}
        visualMaterial={materials.M_black}
        visualPosition={[-12.665, -1.97, 24.302]}
        colliderGeometry={nodes.coll_left_kickback_door.geometry}
        colliderPosition={[-13.574, -2.233, 23.626]}
        sensorPosition={[-13.6, -2.3, 26.5]}
        kickStrength={leftStrength}
      />
      {/* --- KICKBACK DROIT --- */}
      <Kickback
        side="right"
        visualGeometry={nodes.visual_right_kickback_door.geometry}
        visualMaterial={materials.M_black}
        visualPosition={[8.532, -1.97, 25.481]}
        colliderGeometry={nodes.coll_right_kickback_door001.geometry}
        colliderPosition={[8.465, -1.97, 25.481]}
        sensorPosition={[9.4, -2.3, 26.5]}
        kickStrength={rightStrength}
      />

      {/* --- CIBLES FAKIR (Donnent des points) --- */}
      <ScoreTarget
        geometry={nodes.coll_faquir_plank001.geometry}
        position={[10.805, -2.882, -13.695]}
        points={150}
      />
      <ScoreTarget
        geometry={nodes.coll_faquir_plank002.geometry}
        position={[10.805, -2.882, -13.695]}
        points={150}
      />
      <ScoreTarget
        geometry={nodes.coll_faquir_plank003.geometry}
        position={[10.805, -2.882, -13.695]}
        points={150}
      />
      <ScoreTarget
        geometry={nodes.coll_faquir_plank004.geometry}
        position={[10.805, -2.882, -13.695]}
        points={150}
      />
      <ScoreTarget
        geometry={nodes.coll_faquir_plank005.geometry}
        position={[10.805, -2.882, -13.695]}
        points={150}
      />

      <ScoreTarget
        geometry={nodes.coll_faquir_plank006.geometry}
        position={[10.805, -2.882, -13.695]}
        points={150}
      />
      <ScoreTarget
        geometry={nodes.coll_faquir_plank007.geometry}
        position={[10.805, -2.882, -13.695]}
        points={150}
      />
      <ScoreTarget
        geometry={nodes.visual_faquir_plank008.geometry}
        position={[10.805, -2.882, -13.695]}
        points={150}
      />

      <group {...props} dispose={null}>
        <group position={[-0.609, -2.903, 5.131]}>
          <mesh
            geometry={nodes.screws_LOD0.geometry}
            material={materials.PaletteMaterial001}
          />
          <mesh
            geometry={nodes.screws_LOD0_1.geometry}
            material={materials.rubber}
          />
        </group>
        {/* <mesh */}
        {/*   geometry={nodes.visual_obj_flipper_left_bottom.geometry} */}
        {/*   material={materials.M_flipper_arm_left} */}
        {/*   position={[-5.001, -2.901, 26.34]} */}
        {/* /> */}
        {/* <mesh */}
        {/*   geometry={nodes.visual_obj_flipper_right_bottom.geometry} */}
        {/*   material={materials.M_flipper_arm_right} */}
        {/*   position={[2.787, -2.901, 26.34]} */}
        {/* /> */}
        {/* <mesh */}
        {/*   geometry={nodes.visual_obj_gate_5.geometry} */}
        {/*   material={materials.PaletteMaterial001} */}
        {/*   position={[9.283, -1.018, 4.732]} */}
        {/*   rotation={[0, 1.199, 0]} */}
        {/* /> */}
        <mesh
          geometry={nodes.visual_sidewalls.geometry}
          material={materials.M_black}
          position={[-0.609, -2.903, 5.131]}
        />
        {/* <mesh */}
        {/*   geometry={nodes.visual_right_kickback_door.geometry} */}
        {/*   material={materials.M_black} */}
        {/*   position={[8.532, -1.97, 25.481]} */}
        {/* /> */}
        <group position={[-0.984, -6.695, 10.256]}>
          <mesh
            geometry={nodes.holes_nocoll_LOD0.geometry}
            material={materials["M_playfield_cutout.001"]}
          />
          <mesh
            geometry={nodes.holes_nocoll_LOD0_1.geometry}
            material={materials.M_black}
          />
        </group>
        <mesh
          geometry={nodes.visual_ball_rollover.geometry}
          material={materials.PaletteMaterial001}
          position={[12.739, -2.83, 28.136]}
        />
        <mesh
          geometry={nodes.visual_bonus_05.geometry}
          material={materials.PaletteMaterial001}
          position={[9.354, -2.826, 16.868]}
        />
        <mesh
          geometry={nodes.visual_bonus_01.geometry}
          material={materials.PaletteMaterial001}
          position={[-13.585, -2.826, 16.868]}
        />
        <mesh
          geometry={nodes.visual_bonus_02.geometry}
          material={materials.PaletteMaterial001}
          position={[-11.59, -2.826, 16.868]}
        />
        <mesh
          geometry={nodes.visual_bonus_03.geometry}
          material={materials.PaletteMaterial001}
          position={[-9.594, -2.826, 16.868]}
        />
        <mesh
          geometry={nodes.visual_bonus_04.geometry}
          material={materials.PaletteMaterial001}
          position={[7.358, -2.826, 16.868]}
        />
        <group position={[10.362, -2.304, 16.425]}>
          <mesh
            geometry={nodes.posts_outlane_LOD0.geometry}
            material={materials.rubber}
          />
          <mesh
            geometry={nodes.posts_outlane_LOD0_1.geometry}
            material={materials.PaletteMaterial001}
          />
        </group>
        <mesh
          geometry={nodes.visual_plunger.geometry}
          material={materials.PaletteMaterial001}
          position={[12.739, -2.257, 34.931]}
        />
        <mesh
          geometry={nodes.visual_left_hole_ramp.geometry}
          material={materials.PaletteMaterial001}
          position={[-0.513, -2.174, 5.114]}
        />
        {/* <mesh */}
        {/*   geometry={nodes.visual_left_kickback_door.geometry} */}
        {/*   material={materials.M_black} */}
        {/*   position={[-12.665, -1.97, 24.302]} */}
        {/* /> */}
        <mesh
          geometry={nodes.visual_playfield_left_hole.geometry}
          material={materials.playfield}
          position={[-0.609, -2.903, 7.762]}
        />
        <mesh
          geometry={nodes.visual_holding_flag.geometry}
          material={materials.PaletteMaterial001}
          position={[-0.622, -2.903, 5.131]}
        />
        <mesh
          geometry={nodes.visual_screws_slingshots.geometry}
          material={materials.PaletteMaterial001}
          position={[-1.108, -1.247, 19.416]}
        />
        <mesh
          geometry={nodes.visual_super_rubber.geometry}
          material={materials.PaletteMaterial001}
          position={[-2.105, 0.799, 0.974]}
        />
        <mesh
          geometry={nodes.visual_screws_13002.geometry}
          material={materials.PaletteMaterial001}
          position={[-0.609, 0.4, 5.131]}
        />
        <mesh
          geometry={nodes.visual_sidewalls001.geometry}
          material={materials.PaletteMaterial001}
          position={[-0.609, -2.903, 5.131]}
        />
        <mesh
          geometry={nodes.visual_overlap_bottom_3002.geometry}
          material={materials.M_black}
          position={[-0.609, -2.377, 5.131]}
        />
        <mesh
          geometry={nodes.visual_standard.geometry}
          material={materials.PaletteMaterial001}
          position={[-0.633, -1.56, 7.78]}
        />
        <mesh
          geometry={nodes.visual_ramp_back_test001.geometry}
          material={materials.Brick2}
          position={[-0.609, -2.903, 5.131]}
        />
        <mesh
          geometry={nodes.visual_standard_collision_sidewalls_back001.geometry}
          material={materials.M_black}
          position={[-0.633, -10.856, 7.78]}
        />
        <mesh
          geometry={nodes.visual_habit_right_9_top.geometry}
          material={materials.PaletteMaterial001}
          position={[0.143, -4.465, -2.19]}
        />
        <mesh
          geometry={nodes.visual_habit_right_left_9_top002.geometry}
          material={materials.PaletteMaterial001}
          position={[0.143, -4.465, -2.19]}
        />
        {/* <mesh */}
        {/*   geometry={nodes.visual_barrel_bumpers003.geometry} */}
        {/*   material={materials["barrel.001"]} */}
        {/*   position={[-6.632, -1.561, -12.833]} */}
        {/* /> */}
        <mesh
          geometry={nodes.visual_rollover_top_1001.geometry}
          material={materials.PaletteMaterial001}
          position={[4.56, 1.702, -20.871]}
        />
        <mesh
          geometry={nodes.visual_rollover_top_2001.geometry}
          material={materials.PaletteMaterial001}
          position={[6.955, 1.702, -20.905]}
        />
        <mesh
          geometry={nodes.visual_rollover_top_3001.geometry}
          material={materials.PaletteMaterial001}
          position={[9.38, 1.702, -20.867]}
        />
        <group position={[4.104, -4.469, 5.131]}>
          <mesh
            geometry={nodes.mpf_metal_wires_LOD0001.geometry}
            material={materials.PaletteMaterial001}
          />
          <mesh
            geometry={nodes.mpf_metal_wires_LOD0001_1.geometry}
            material={materials.rubber}
          />
        </group>
        <mesh
          geometry={nodes.visual_barrel_bumpers001.geometry}
          material={materials["barrel.001"]}
          position={[1.103, -1.561, -11.126]}
        />
        <mesh
          geometry={nodes.visual_barrel_bumpers002.geometry}
          material={materials["barrel.001"]}
          position={[-4.753, -1.561, -6.47]}
        />
        <mesh
          geometry={nodes.visual_habit_vuk.geometry}
          material={materials.PaletteMaterial001}
          position={[10.493, 4.188, -21.258]}
        />
        <mesh
          geometry={nodes.visual_base_habit_vuk.geometry}
          material={materials.PaletteMaterial001}
          position={[12.976, -0.549, -21.241]}
        />
        <mesh
          geometry={nodes.visual_hight_playfield.geometry}
          material={materials.Brick3}
          position={[2.084, -2.882, -17.598]}
        />
        <mesh
          geometry={nodes.visual_faquir_plank001.geometry}
          material={materials.PaletteMaterial001}
          position={[10.805, -2.882, -13.695]}
        />
        <mesh
          geometry={nodes.visual_faquir_plank002.geometry}
          material={materials.PaletteMaterial001}
          position={[10.805, -2.882, -13.695]}
        />
        <mesh
          geometry={nodes.visual_faquir_plank003.geometry}
          material={materials.PaletteMaterial001}
          position={[10.217, -0.452, -12.166]}
          rotation={[0, -0.398, 0]}
        />
        <mesh
          geometry={nodes.visual_faquir_plank004.geometry}
          material={materials.PaletteMaterial001}
          position={[10.805, -2.882, -13.695]}
        />
        <mesh
          geometry={nodes.visual_faquir_plank005.geometry}
          material={materials.PaletteMaterial001}
          position={[10.805, -2.882, -13.695]}
        />
        <mesh
          geometry={nodes.visual_faquir_plank006.geometry}
          material={materials.PaletteMaterial001}
          position={[10.805, -2.882, -13.695]}
        />
        <mesh
          geometry={nodes.visual_faquir_plank007.geometry}
          material={materials.PaletteMaterial001}
          position={[10.805, -2.882, -13.695]}
        />
        <mesh
          geometry={nodes.visual_faquir_plank008.geometry}
          material={materials.PaletteMaterial001}
          position={[10.805, -2.882, -13.695]}
        />
        <mesh
          geometry={nodes.visual_faquir.geometry}
          material={materials.Brick4}
          position={[10.805, -2.882, -13.695]}
        />
        <group position={[-9.978, -1.495, 5.084]}>
          <mesh
            geometry={nodes.light1_Lamp_0.geometry}
            material={materials.rock_01}
          />
          <mesh
            geometry={nodes.light1_Lamp_0_1.geometry}
            material={materials.plywood}
          />
          <mesh
            geometry={nodes.light1_Lamp_0_2.geometry}
            material={materials.PaletteMaterial001}
          />
        </group>
        {/* <mesh */}
        {/*   geometry={nodes.visual_mine_plank001.geometry} */}
        {/*   material={materials.plywood} */}
        {/*   position={[-9.978, -1.495, 5.084]} */}
        {/* /> */}
        {/* <mesh */}
        {/*   geometry={nodes.visual_mine_plank002.geometry} */}
        {/*   material={materials.plywood} */}
        {/*   position={[-9.978, -1.495, 5.084]} */}
        {/* /> */}
        {/* <mesh */}
        {/*   geometry={nodes.visual_mine_plank003.geometry} */}
        {/*   material={materials.plywood} */}
        {/*   position={[-9.978, -1.495, 5.084]} */}
        {/* /> */}
        {/* <mesh */}
        {/*   geometry={nodes.visual_ruby002.geometry} */}
        {/*   material={materials.PaletteMaterial003} */}
        {/*   position={[-4.739, 0.412, -6.466]} */}
        {/* /> */}
        {/* <mesh */}
        {/*   geometry={nodes.visual_ruby003.geometry} */}
        {/*   material={materials.PaletteMaterial003} */}
        {/*   position={[-6.642, 0.412, -12.848]} */}
        {/* /> */}
        {/* <mesh */}
        {/*   geometry={nodes.visual_ruby001.geometry} */}
        {/*   material={materials.PaletteMaterial003} */}
        {/*   position={[1.11, 0.412, -11.152]} */}
        {/* /> */}
        {/* <mesh */}
        {/*   geometry={nodes.coll_flipper_left_bottom.geometry} */}
        {/*   material={nodes.coll_flipper_left_bottom.material} */}
        {/*   position={[-5.001, -2.901, 26.34]} */}
        {/* /> */}
        {/* <mesh */}
        {/*   geometry={nodes.coll_flipper_right_bottom.geometry} */}
        {/*   material={nodes.coll_flipper_right_bottom.material} */}
        {/*   position={[2.787, -2.901, 26.34]} */}
        {/* /> */}
        <RigidBody
          type="fixed"
          colliders="trimesh"
          restitution={0}
          restitutionCombineRule={CoefficientCombineRule.Min}
          includeInvisible
        >
          <mesh
            visible={false}
            geometry={nodes.coll_scoop_hole_left.geometry}
            material={nodes.coll_scoop_hole_left.material}
            position={[-5.444, -4.23, -2.829]}
          />
        </RigidBody>
        <RigidBody
          type="fixed"
          colliders="trimesh"
          restitution={0}
          restitutionCombineRule={CoefficientCombineRule.Min}
          friction={0.1}
          includeInvisible
          name="coll_playfield_collision_left_hole"
        >
          <mesh
            visible={false}
            geometry={nodes.coll_playfield_collision_left_hole.geometry}
            material={nodes.coll_playfield_collision_left_hole.material}
            position={[-0.609, -2.903, 7.762]}
          />
        </RigidBody>
        <RigidBody
          type="fixed"
          colliders="trimesh"
          name="stone_ramp"
          restitution={0} // Pas de rebond, la bille reste collée à la piste
          friction={0} // 0 pour une glisse parfaite, ou 0.1 pour un très léger freinage
          frictionCombineRule={CoefficientCombineRule.Min} // on force la glisse maximale
          includeInvisible
        >
          <mesh
            visible={false}
            geometry={nodes.coll_ramp_back_test.geometry}
            material={nodes.coll_ramp_back_test.material}
            position={[-0.609, -2.903, 5.131]}
          />
        </RigidBody>
        <RigidBody
          type="fixed"
          colliders="trimesh"
          name="coll_hight_playfield"
          restitution={0}
          friction={0}
          frictionCombineRule={CoefficientCombineRule.Min}
          includeInvisible
        >
          <mesh
            visible={false}
            geometry={nodes.coll_hight_playfield.geometry}
            material={nodes.coll_hight_playfield.material}
            position={[2.084, -2.882, -17.598]}
          />
        </RigidBody>
        <RigidBody
          type="fixed"
          colliders="trimesh"
          name="coll_standard_collision"
          restitution={0}
          friction={0}
          frictionCombineRule={CoefficientCombineRule.Min}
          includeInvisible
        >
          <mesh
            visible={false}
            geometry={nodes.coll_standard_collision.geometry}
            material={nodes.coll_standard_collision.material}
            position={[-0.633, -1.467, 7.78]}
          />
        </RigidBody>
        <RigidBody type="fixed" colliders="trimesh" includeInvisible>
          <mesh
            visible={false}
            geometry={nodes.coll_metal.geometry}
            material={nodes.coll_metal.material}
            position={[0.313, -2.424, 23.779]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_ramp_metal.geometry}
            material={nodes.coll_ramp_metal.material}
            position={[-1.088, -2.185, 21.588]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_left_hole_sidewalls.geometry}
            material={nodes.coll_left_hole_sidewalls.material}
            position={[-0.557, -2.233, 8.325]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_posts_outlane.geometry}
            material={nodes.coll_posts_outlane.material}
            position={[-2.08, -2.233, 16.425]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_left_hole.geometry}
            material={nodes.coll_left_hole.material}
            position={[-12.556, -5.859, 5.794]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_super_rubber.geometry}
            material={nodes.coll_super_rubber.material}
            position={[-2.105, 0.799, 0.974]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_rubber.geometry}
            material={nodes.coll_rubber.material}
            position={[-2.097, -0.236, -1.55]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_standard_collision_sidewalls_back.geometry}
            material={nodes.coll_standard_collision_sidewalls_back.material}
            position={[-0.633, -10.856, 7.78]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_scoop_hole_left.geometry}
            material={nodes.coll_scoop_hole_left.material}
            position={[-5.444, -4.23, -2.829]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_visual_mpf_metal_wires_11.geometry}
            material={materials.PaletteMaterial001}
            position={[2.609, -0.768, 0.974]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_sidewalls001.geometry}
            material={nodes.coll_sidewalls001.material}
            position={[-0.557, -2.126, 8.325]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_sidewalls002.geometry}
            material={nodes.coll_sidewalls002.material}
            position={[-0.557, -2.233, 8.325]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_faquir_glass_panel001.geometry}
            material={nodes.coll_faquir_glass_panel001.material}
            position={[10.805, -2.882, -13.695]}
            rotation={[0, 0.017, 0]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_glass_panel001.geometry}
            material={nodes.coll_glass_panel001.material}
            position={[-2.178, -1.315, 25.471]}
            scale={[13.446, 0.143, 5.159]}
          />
        </RigidBody>
        <RigidBody
          type="fixed"
          colliders="trimesh"
          name="coll_ramps"
          includeInvisible
          restitution={0}
          friction={0}
          frictionCombineRule={CoefficientCombineRule.Min}
        >
          <mesh
            visible={false}
            geometry={nodes.coll_visual_habit_right_9_top.geometry}
            material={nodes.coll_visual_habit_right_9_top.material}
            position={[0.143, -4.465, -2.19]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_visual_habit_right_left_9_top002.geometry}
            material={nodes.coll_visual_habit_right_left_9_top002.material}
            position={[0.143, -4.465, -2.19]}
          />
          <mesh
            visible={false}
            geometry={nodes.coll_habit_vuk.geometry}
            material={nodes.coll_habit_vuk.material}
            position={[10.186, 5.001, -21.251]}
          />
        </RigidBody>
        <RigidBody
          type="fixed"
          colliders="trimesh"
          name="coll_faquir"
          includeInvisible
        >
          <mesh
            visible={false}
            geometry={nodes.coll_faquir.geometry}
            material={nodes.coll_faquir.material}
            position={[10.805, -2.882, -13.695]}
          />
        </RigidBody>
        <mesh
          geometry={nodes.visual_Tower_Brick_MT_0.geometry}
          material={materials.Brick_MT}
          position={[-13.618, 3.446, 2.318]}
        />
        <mesh
          geometry={nodes.visual_Tower_Details_MT_0.geometry}
          material={materials.Details_MT}
          position={[-13.618, 3.446, 2.318]}
        />
        <mesh
          geometry={nodes.visual_Tower_Glass_MT_0.geometry}
          material={materials.PaletteMaterial002}
          position={[-13.618, 3.446, 2.318]}
        />
        <mesh
          geometry={nodes.visual_Tower_Plaster_MT_0.geometry}
          material={materials.Plaster_MT}
          position={[-13.618, 3.446, 2.318]}
        />
        <mesh
          geometry={nodes.visual_Tower_Roof_MT_0.geometry}
          material={materials.Roof_MT}
          position={[-13.618, 3.446, 2.318]}
        />
      </group>
    </>
  );
}

useGLTF.preload("/models/PinballMVP_Base-transformed.glb");
