import { useControls } from "leva";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";
import type { JSX } from "react";
import { RigidBody, CoefficientCombineRule } from "@react-three/rapier";
import Flipper from "@/components/Flipper";
import Kickback from "@/components/Kickback";
import Slingshot from "@/components/Slingshot";
import Bumper from "@/components/Bumper";
import Ball from "@/components/Ball";
import LauncherGate from "@/components/LauncherGate";
import DeathZone from "@/components/DeathZone";
import GoldMine from "@/components/GoldMine";
import ScoreTarget from "@/components/ScoreTarget";
import HoleSensor from "@/components/HoleSensor";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";

type GLTFResult = GLTF & {
  nodes: {
    visual_Tower_Glass_MT_0: THREE.Mesh;
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
    visual_bonus_04: THREE.Mesh;
    visual_bonus_05: THREE.Mesh;
    visual_bonus_01: THREE.Mesh;
    visual_bonus_02: THREE.Mesh;
    visual_bonus_03: THREE.Mesh;
    posts_outlane_LOD0: THREE.Mesh;
    posts_outlane_LOD0_1: THREE.Mesh;
    visual_plunger: THREE.Mesh;
    visual_left_hole_ramp: THREE.Mesh;
    visual_left_kickback_door: THREE.Mesh;
    visual_playfield_left_hole: THREE.Mesh;
    visual_holding_flag: THREE.Mesh;
    visual_screws_13002: THREE.Mesh;
    visual_sidewalls001: THREE.Mesh;
    visual_overlap_bottom_3002: THREE.Mesh;
    standard_collision_LOD0003: THREE.Mesh;
    standard_collision_LOD0003_1: THREE.Mesh;
    visual_standard_collision_sidewalls_back001: THREE.Mesh;
    habit_right_LOD0002: THREE.Mesh;
    habit_right_LOD0002_1: THREE.Mesh;
    habit_right_LOD0009: THREE.Mesh;
    habit_right_LOD0009_1: THREE.Mesh;
    lp005_barrel_0001: THREE.Mesh;
    lp005_barrel_0001_1: THREE.Mesh;
    lp005_barrel_0001_2: THREE.Mesh;
    visual_rollover_top_1001: THREE.Mesh;
    visual_rollover_top_2001: THREE.Mesh;
    visual_rollover_top_3001: THREE.Mesh;
    mpf_metal_wires_LOD0001: THREE.Mesh;
    mpf_metal_wires_LOD0001_1: THREE.Mesh;
    mpf_metal_wires_LOD0001_2: THREE.Mesh;
    lp005_barrel_0002: THREE.Mesh;
    lp005_barrel_0002_1: THREE.Mesh;
    lp005_barrel_0002_2: THREE.Mesh;
    lp005_barrel_0003: THREE.Mesh;
    lp005_barrel_0003_1: THREE.Mesh;
    lp005_barrel_0003_2: THREE.Mesh;
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
    light1_Lamp_0: THREE.Mesh;
    light1_Lamp_0_1: THREE.Mesh;
    light1_Lamp_0_2: THREE.Mesh;
    light1_Lamp_0_3: THREE.Mesh;
    light1_Lamp_0_4: THREE.Mesh;
    light1_Lamp_0_5: THREE.Mesh;
    light1_Lamp_0_6: THREE.Mesh;
    light1_Lamp_0_7: THREE.Mesh;
    light1_Lamp_0_8: THREE.Mesh;
    light1_Lamp_0002: THREE.Mesh;
    light1_Lamp_0002_1: THREE.Mesh;
    light1_Lamp_0003: THREE.Mesh;
    light1_Lamp_0003_1: THREE.Mesh;
    light1_Lamp_0004: THREE.Mesh;
    light1_Lamp_0004_1: THREE.Mesh;
    visual_ruby002: THREE.Mesh;
    visual_ruby003: THREE.Mesh;
    visual_ruby001: THREE.Mesh;
    model_2006: THREE.Mesh;
    model_2006_1: THREE.Mesh;
    Circle: THREE.Mesh;
    Circle_1: THREE.Mesh;
    Circle_2: THREE.Mesh;
    Circle_3: THREE.Mesh;
    Circle_4: THREE.Mesh;
    Mesh004: THREE.Mesh;
    Mesh004_1: THREE.Mesh;
    Mesh004_2: THREE.Mesh;
    Mesh004_3: THREE.Mesh;
    visual_field: THREE.Mesh;
    Cube002: THREE.Mesh;
    Cube002_1: THREE.Mesh;
    Cube002_2: THREE.Mesh;
    Cube002_3: THREE.Mesh;
    model_6001: THREE.Mesh;
    model_6001_1: THREE.Mesh;
    model_6001_2: THREE.Mesh;
    model_6001_3: THREE.Mesh;
    model_6001_4: THREE.Mesh;
    model_6001_5: THREE.Mesh;
    model_6001_6: THREE.Mesh;
    model_6001_7: THREE.Mesh;
    model_6001_8: THREE.Mesh;
    visual_hight_playfield_bars_top: THREE.Mesh;
    visual_super_rubber_class_coin: THREE.Mesh;
    Cylinder004: THREE.Mesh;
    Cylinder004_1: THREE.Mesh;
    Cylinder004_2: THREE.Mesh;
    Cylinder004_3: THREE.Mesh;
    Cylinder007: THREE.Mesh;
    Cylinder007_1: THREE.Mesh;
    Cylinder007_2: THREE.Mesh;
    Cylinder007_3: THREE.Mesh;
    Cylinder008: THREE.Mesh;
    Cylinder008_1: THREE.Mesh;
    Cylinder008_2: THREE.Mesh;
    Cylinder008_3: THREE.Mesh;
    Cylinder009: THREE.Mesh;
    Cylinder009_1: THREE.Mesh;
    Cylinder009_2: THREE.Mesh;
    Cylinder009_3: THREE.Mesh;
    visual_faquir_bars_bottom: THREE.Mesh;
    model_0002: THREE.Mesh;
    model_0002_1: THREE.Mesh;
    visual_super_rubber_class_coin_plane_bottom: THREE.Mesh;
    defaultMaterial: THREE.Mesh;
    defaultMaterial_1: THREE.Mesh;
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
    coll_mine_gate: THREE.Mesh;
    coll_sidewalls002: THREE.Mesh;
    coll_cannon: THREE.Mesh;
    coll_faquir_bars_bottom: THREE.Mesh;
    coll_hight_playfield_bars_top: THREE.Mesh;
    visual_lg_10x: THREE.Mesh;
    coll_faquir_glass_panel001: THREE.Mesh;
    coll_glass_panel001: THREE.Mesh;
  };
  materials: {
    Glass_MT: THREE.MeshPhysicalMaterial;
    M_metal: THREE.MeshStandardMaterial;
    M_roof: THREE.MeshStandardMaterial;
    M_flipper_arm_left: THREE.MeshStandardMaterial;
    M_flipper_arm_right: THREE.MeshStandardMaterial;
    Gold: THREE.MeshStandardMaterial;
    ["M_playfield_cutout.001"]: THREE.MeshStandardMaterial;
    chrome: THREE.MeshStandardMaterial;
    ["rubber.001"]: THREE.MeshStandardMaterial;
    RedChrome: THREE.MeshStandardMaterial;
    collision: THREE.MeshStandardMaterial;
    playfield: THREE.MeshStandardMaterial;
    M_top_playfield: THREE.MeshStandardMaterial;
    M_grass: THREE.MeshStandardMaterial;
    M_stone_light: THREE.MeshStandardMaterial;
    M_wood_dark: THREE.MeshStandardMaterial;
    M_stone_medium: THREE.MeshStandardMaterial;
    M_pipe: THREE.MeshStandardMaterial;
    ["M_stone_light.004"]: THREE.MeshStandardMaterial;
    ["M_stone_medium.009"]: THREE.MeshStandardMaterial;
    ["M_stone_medium.008"]: THREE.MeshStandardMaterial;
    ["M_stone_medium.007"]: THREE.MeshStandardMaterial;
    ["M_stone_medium.006"]: THREE.MeshStandardMaterial;
    ["M_stone_light.006"]: THREE.MeshStandardMaterial;
    ["M_stone_medium.005"]: THREE.MeshStandardMaterial;
    ["M_stone_medium.004"]: THREE.MeshStandardMaterial;
    M_rock: THREE.MeshStandardMaterial;
    M_wood_light: THREE.MeshStandardMaterial;
    M_wood_medium: THREE.MeshStandardMaterial;
    ["M_wood_dark.002"]: THREE.MeshStandardMaterial;
    M_wool: THREE.MeshStandardMaterial;
    ["Material.001"]: THREE.MeshStandardMaterial;
    M_red_ruby: THREE.MeshStandardMaterial;
    M_green_ruby: THREE.MeshStandardMaterial;
    M_blue_ruby: THREE.MeshStandardMaterial;
    ["M_stone_light.001"]: THREE.MeshStandardMaterial;
    ["M_stone_medium.001"]: THREE.MeshStandardMaterial;
    ["M_wood_medium.001"]: THREE.MeshStandardMaterial;
    ["M_wood_dark.001"]: THREE.MeshStandardMaterial;
    ["M_roof.001"]: THREE.MeshStandardMaterial;
    ["M_stone_light.003"]: THREE.MeshStandardMaterial;
    M_yellow: THREE.MeshStandardMaterial;
    M_black: THREE.MeshStandardMaterial;
    ["M_stone_light.005"]: THREE.MeshStandardMaterial;
    ["M_stone_medium.003"]: THREE.MeshStandardMaterial;
    ["M_stone_light.002"]: THREE.MeshStandardMaterial;
    ["M_wood_light.001"]: THREE.MeshStandardMaterial;
    ["M_wood_medium.002"]: THREE.MeshStandardMaterial;
    ["M_wood_dark.003"]: THREE.MeshStandardMaterial;
    M_window: THREE.MeshStandardMaterial;
    M_primary: THREE.MeshStandardMaterial;
    ["M_roof.002"]: THREE.MeshStandardMaterial;
    ["M_metal.001"]: THREE.MeshStandardMaterial;
    ["M_stone_medium.002"]: THREE.MeshStandardMaterial;
    ["M_metal.003"]: THREE.MeshStandardMaterial;
    M_in_coll: THREE.MeshStandardMaterial;
    M_drum: THREE.MeshStandardMaterial;
    ["M_metal.002"]: THREE.MeshStandardMaterial;
    M_tree: THREE.MeshStandardMaterial;
    Blade: THREE.MeshBasicMaterial;
    Hilt: THREE.MeshBasicMaterial;
    lamp_playfield: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

export default function Model(props: JSX.IntrinsicElements["group"]) {
  const { nodes, materials } = useGLTF(
    "/models/Pinball_BaseFinal.glb",
  ) as unknown as GLTFResult;

  // Debug Leva
  const { startX, startY, startZ } = useControls("Ball Position", {
    startX: { value: 12.75, min: -20, max: 20, step: 0.1 },
    startY: { value: -2.3, min: -20, max: 20, step: 0.1 },
    startZ: { value: 30.46, min: -40, max: 80, step: 0.1 },
  });
  const { leftStrength, rightStrength } = useControls("Kickbacks", {
    leftStrength: { value: 120, min: 0, max: 200, step: 1 },
    rightStrength: { value: 120, min: 0, max: 200, step: 1 },
  });
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
      {/* A refaire */}
      {/* <Bumper */}
      {/*   id={0} */}
      {/*   colliderGeometry={nodes.coll_bumpers001.geometry} */}
      {/*   visualGeometry={nodes.lp005_barrel_0001.geometry} */}
      {/*   visualMaterial={materials.PaletteMaterial001} */}
      {/*   rubyGeometry={nodes.visual_ruby001.geometry} // Rubis correspondant */}
      {/*   rubyMaterial={materials.PaletteMaterial003} */}
      {/*   position={[1.112, -1.6, -11.134]} */}
      {/*   strength={20} */}
      {/* /> */}
      {/* <Bumper */}
      {/*   id={1} */}
      {/*   colliderGeometry={nodes.coll_bumpers002.geometry} */}
      {/*   visualGeometry={nodes.lp005_barrel_0001_1.geometry} */}
      {/*   visualMaterial={materials.PaletteMaterial001} */}
      {/*   rubyGeometry={nodes.visual_ruby002.geometry} // Rubis correspondant */}
      {/*   rubyMaterial={materials.PaletteMaterial003} */}
      {/*   position={[-4.744, -1.6, -6.463]} */}
      {/*   strength={20} */}
      {/* /> */}
      {/* <Bumper */}
      {/*   id={2} */}
      {/*   colliderGeometry={nodes.coll_bumpers003.geometry} */}
      {/*   visualGeometry={nodes.lp005_barrel_0001_2.geometry} */}
      {/*   visualMaterial={materials.PaletteMaterial001} */}
      {/*   rubyGeometry={nodes.visual_ruby003.geometry} // Rubis correspondant */}
      {/*   rubyMaterial={materials.PaletteMaterial003} */}
      {/*   position={[-6.635, -1.6, -12.845]} */}
      {/*   strength={20} */}
      {/* /> */}
      {/* Bumper 0 */}
      <Bumper
        id={0}
        colliderGeometry={nodes.coll_bumpers001.geometry}
        position={[1.112, -1.6, -11.134]}
        strength={20}
        rubyGeometry={nodes.visual_ruby001.geometry}
        rubyMaterial={materials.M_blue_ruby}
        visualNode={
          <>
            <mesh
              geometry={nodes.lp005_barrel_0002.geometry}
              material={materials.M_wood_medium}
            />
            <mesh
              geometry={nodes.lp005_barrel_0002_1.geometry}
              material={materials.M_wood_dark}
            />
            <mesh
              geometry={nodes.lp005_barrel_0002_2.geometry}
              material={materials.M_wood_light}
            />
          </>
        }
      />

      {/* Bumper 1 */}
      <Bumper
        id={1}
        colliderGeometry={nodes.coll_bumpers002.geometry}
        position={[-4.744, -1.6, -6.463]}
        strength={20}
        rubyGeometry={nodes.visual_ruby002.geometry}
        rubyMaterial={materials.M_red_ruby}
        visualNode={
          <>
            <mesh
              geometry={nodes.lp005_barrel_0003.geometry}
              material={materials.M_wood_medium}
            />
            <mesh
              geometry={nodes.lp005_barrel_0003_1.geometry}
              material={materials.M_wood_dark}
            />
            <mesh
              geometry={nodes.lp005_barrel_0003_2.geometry}
              material={materials.M_wood_light}
            />
          </>
        }
      />

      {/* Bumper 2 */}
      <Bumper
        id={2}
        colliderGeometry={nodes.coll_bumpers003.geometry}
        position={[-6.635, -1.6, -12.845]}
        strength={20}
        rubyGeometry={nodes.visual_ruby003.geometry}
        rubyMaterial={materials.M_green_ruby}
        visualNode={
          <>
            <mesh
              geometry={nodes.lp005_barrel_0001.geometry}
              material={materials.M_wood_medium}
            />
            <mesh
              geometry={nodes.lp005_barrel_0001_1.geometry}
              material={materials.M_wood_dark}
            />
            <mesh
              geometry={nodes.lp005_barrel_0001_2.geometry}
              material={materials.M_wood_light}
            />
          </>
        }
      />
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
        position={[9.866, -2.882, -14.48]}
        points={150}
      />
      {/* <ScoreTarget */}
      {/*   geometry={nodes.coll_faquir_plank002.geometry} */}
      {/*   position={[6.394, -0.452, -12.896]} */}
      {/*   points={150} */}
      {/* /> */}
      <ScoreTarget
        geometry={nodes.coll_faquir_plank003.geometry}
        position={[9.134, -0.452, -12.781]}
        points={150}
      />
      <ScoreTarget
        geometry={nodes.coll_faquir_plank004.geometry}
        position={[7.995, -0.452, -10.223]}
        points={150}
      />
      <ScoreTarget
        geometry={nodes.coll_faquir_plank005.geometry}
        position={[7.527, -0.452, -6]}
        points={150}
      />

      <ScoreTarget
        geometry={nodes.coll_faquir_plank006.geometry}
        position={[8.799, -0.452, -8.033]}
        points={150}
      />
      <ScoreTarget
        geometry={nodes.coll_faquir_plank007.geometry}
        position={[7.12, -0.452, -3.509]}
        points={150}
      />
      <group {...props} dispose={null}>
        <group name="Scene">
          <group name="visual_TowerModel" position={[-13.618, -1.583, 2.318]}>
            <group name="visual_2c284678f7ae41a7bc9e7a9136bf479ffbx">
              <group name="visual_RootNode">
                <group name="visual_Tower" position={[0, 5.03, 0]}>
                  <mesh
                    name="visual_Tower_Glass_MT_0"
                    geometry={nodes.visual_Tower_Glass_MT_0.geometry}
                    material={materials.Glass_MT}
                  />
                </group>
              </group>
            </group>
          </group>
          <group
            name="visual_super_rubber001"
            position={[-0.768, -1.898, 19.715]}
          />
          <group name="visual_screws_13" position={[-0.609, -2.903, 5.131]}>
            <mesh
              name="screws_LOD0"
              geometry={nodes.screws_LOD0.geometry}
              material={materials.M_metal}
            />
            <mesh
              name="screws_LOD0_1"
              geometry={nodes.screws_LOD0_1.geometry}
              material={materials.M_roof}
            />
          </group>
          {/* <mesh */}
          {/*   name="visual_obj_flipper_left_bottom" */}
          {/*   geometry={nodes.visual_obj_flipper_left_bottom.geometry} */}
          {/*   material={materials.M_flipper_arm_left} */}
          {/*   position={[-5.001, -2.901, 26.34]} */}
          {/* /> */}
          {/* <mesh */}
          {/*   name="visual_obj_flipper_right_bottom" */}
          {/*   geometry={nodes.visual_obj_flipper_right_bottom.geometry} */}
          {/*   material={materials.M_flipper_arm_right} */}
          {/*   position={[2.787, -2.901, 26.34]} */}
          {/* /> */}
          {/* <mesh */}
          {/*   name="visual_obj_gate_5" */}
          {/*   geometry={nodes.visual_obj_gate_5.geometry} */}
          {/*   material={materials.Gold} */}
          {/*   position={[9.283, -1.018, 4.732]} */}
          {/* /> */}
          <mesh
            name="visual_sidewalls"
            geometry={nodes.visual_sidewalls.geometry}
            material={materials.M_in_coll}
            position={[-0.609, -2.903, 5.131]}
          />
          {/* <mesh */}
          {/*   name="visual_right_kickback_door" */}
          {/*   geometry={nodes.visual_right_kickback_door.geometry} */}
          {/*   material={materials.M_in_coll} */}
          {/*   position={[8.532, -1.97, 25.481]} */}
          {/* /> */}
          <group name="visual_holes_nocoll" position={[-0.984, -6.695, 10.256]}>
            <mesh
              name="holes_nocoll_LOD0"
              geometry={nodes.holes_nocoll_LOD0.geometry}
              material={materials["M_playfield_cutout.001"]}
            />
            <mesh
              name="holes_nocoll_LOD0_1"
              geometry={nodes.holes_nocoll_LOD0_1.geometry}
              material={materials.M_black}
            />
          </group>
          <mesh
            name="visual_ball_rollover"
            geometry={nodes.visual_ball_rollover.geometry}
            material={materials.chrome}
            position={[12.739, -2.83, 28.136]}
          />
          <mesh
            name="visual_bonus_04"
            geometry={nodes.visual_bonus_04.geometry}
            material={materials.M_metal}
            position={[7.358, -2.826, 16.868]}
          />
          <mesh
            name="visual_bonus_05"
            geometry={nodes.visual_bonus_05.geometry}
            material={materials.M_metal}
            position={[9.354, -2.826, 16.868]}
          />
          <mesh
            name="visual_bonus_01"
            geometry={nodes.visual_bonus_01.geometry}
            material={materials.M_metal}
            position={[-13.585, -2.826, 16.868]}
          />
          <mesh
            name="visual_bonus_02"
            geometry={nodes.visual_bonus_02.geometry}
            material={materials.M_metal}
            position={[-11.59, -2.826, 16.868]}
          />
          <mesh
            name="visual_bonus_03"
            geometry={nodes.visual_bonus_03.geometry}
            material={materials.M_metal}
            position={[-9.594, -2.826, 16.868]}
          />
          <group
            name="visual_posts_outlane"
            position={[10.362, -2.304, 16.425]}
          >
            <mesh
              name="posts_outlane_LOD0"
              geometry={nodes.posts_outlane_LOD0.geometry}
              material={materials["rubber.001"]}
            />
            <mesh
              name="posts_outlane_LOD0_1"
              geometry={nodes.posts_outlane_LOD0_1.geometry}
              material={materials.RedChrome}
            />
          </group>
          <mesh
            name="visual_plunger"
            geometry={nodes.visual_plunger.geometry}
            material={materials.collision}
            position={[12.739, -2.257, 34.931]}
          />
          <mesh
            name="visual_left_hole_ramp"
            geometry={nodes.visual_left_hole_ramp.geometry}
            material={materials.chrome}
            position={[-0.513, -2.174, 5.114]}
          />
          {/* <mesh */}
          {/*   name="visual_left_kickback_door" */}
          {/*   geometry={nodes.visual_left_kickback_door.geometry} */}
          {/*   material={materials.M_in_coll} */}
          {/*   position={[-12.665, -1.97, 24.302]} */}
          {/* /> */}
          <mesh
            name="visual_playfield_left_hole"
            geometry={nodes.visual_playfield_left_hole.geometry}
            material={materials.playfield}
            position={[-0.609, -2.903, 7.762]}
          />
          <mesh
            name="visual_holding_flag"
            geometry={nodes.visual_holding_flag.geometry}
            material={materials.M_metal}
            position={[-0.622, -2.903, 5.131]}
          />
          <mesh
            name="visual_screws_13002"
            geometry={nodes.visual_screws_13002.geometry}
            material={materials.M_roof}
            position={[-0.609, 0.4, 5.131]}
          />
          <mesh
            name="visual_sidewalls001"
            geometry={nodes.visual_sidewalls001.geometry}
            material={materials.M_in_coll}
            position={[-0.609, -2.903, 5.131]}
          />
          <mesh
            name="visual_overlap_bottom_3002"
            geometry={nodes.visual_overlap_bottom_3002.geometry}
            material={materials.M_in_coll}
            position={[-0.609, -2.377, 5.131]}
          />
          <group name="visual_standard" position={[-0.633, -1.56, 7.78]}>
            <mesh
              name="standard_collision_LOD0003"
              geometry={nodes.standard_collision_LOD0003.geometry}
              material={materials.M_top_playfield}
            />
            <mesh
              name="standard_collision_LOD0003_1"
              geometry={nodes.standard_collision_LOD0003_1.geometry}
              material={materials.M_grass}
            />
          </group>
          <mesh
            name="visual_standard_collision_sidewalls_back001"
            geometry={
              nodes.visual_standard_collision_sidewalls_back001.geometry
            }
            material={materials.M_in_coll}
            position={[-0.633, -10.856, 7.78]}
          />
          <group
            name="visual_habit_right_9_top"
            position={[0.143, -4.465, -2.19]}
          >
            <mesh
              name="habit_right_LOD0002"
              geometry={nodes.habit_right_LOD0002.geometry}
              material={materials.M_metal}
            />
            <mesh
              name="habit_right_LOD0002_1"
              geometry={nodes.habit_right_LOD0002_1.geometry}
              material={materials.M_stone_light}
            />
          </group>
          <group
            name="visual_habit_right_left_9_top002"
            position={[0.143, -4.465, -2.19]}
          >
            <mesh
              name="habit_right_LOD0009"
              geometry={nodes.habit_right_LOD0009.geometry}
              material={materials.M_metal}
            />
            <mesh
              name="habit_right_LOD0009_1"
              geometry={nodes.habit_right_LOD0009_1.geometry}
              material={materials.M_stone_light}
            />
          </group>
          {/* <group */}
          {/*   name="visual_barrel_bumpers003" */}
          {/*   position={[-6.632, -1.561, -12.833]} */}
          {/* > */}
          {/*   <mesh */}
          {/*     name="lp005_barrel_0001" */}
          {/*     geometry={nodes.lp005_barrel_0001.geometry} */}
          {/*     material={materials.M_wood_medium} */}
          {/*   /> */}
          {/*   <mesh */}
          {/*     name="lp005_barrel_0001_1" */}
          {/*     geometry={nodes.lp005_barrel_0001_1.geometry} */}
          {/*     material={materials.M_wood_dark} */}
          {/*   /> */}
          {/*   <mesh */}
          {/*     name="lp005_barrel_0001_2" */}
          {/*     geometry={nodes.lp005_barrel_0001_2.geometry} */}
          {/*     material={materials.M_wood_light} */}
          {/*   /> */}
          {/* </group> */}
          <mesh
            name="visual_rollover_top_1001"
            geometry={nodes.visual_rollover_top_1001.geometry}
            material={materials.M_metal}
            position={[4.56, 1.702, -20.871]}
          />
          <mesh
            name="visual_rollover_top_2001"
            geometry={nodes.visual_rollover_top_2001.geometry}
            material={materials.M_metal}
            position={[6.955, 1.702, -20.905]}
          />
          <mesh
            name="visual_rollover_top_3001"
            geometry={nodes.visual_rollover_top_3001.geometry}
            material={materials.M_metal}
            position={[9.38, 1.702, -20.867]}
          />
          <group
            name="visual_mpf_metal_wires_11"
            position={[4.104, -4.469, 5.131]}
          >
            <mesh
              name="mpf_metal_wires_LOD0001"
              geometry={nodes.mpf_metal_wires_LOD0001.geometry}
              material={materials.M_wood_dark}
            />
            <mesh
              name="mpf_metal_wires_LOD0001_1"
              geometry={nodes.mpf_metal_wires_LOD0001_1.geometry}
              material={materials.M_stone_medium}
            />
            <mesh
              name="mpf_metal_wires_LOD0001_2"
              geometry={nodes.mpf_metal_wires_LOD0001_2.geometry}
              material={materials.M_metal}
            />
          </group>
          {/* <group */}
          {/*   name="visual_barrel_bumpers001" */}
          {/*   position={[1.103, -1.561, -11.126]} */}
          {/* > */}
          {/*   <mesh */}
          {/*     name="lp005_barrel_0002" */}
          {/*     geometry={nodes.lp005_barrel_0002.geometry} */}
          {/*     material={materials.M_wood_medium} */}
          {/*   /> */}
          {/*   <mesh */}
          {/*     name="lp005_barrel_0002_1" */}
          {/*     geometry={nodes.lp005_barrel_0002_1.geometry} */}
          {/*     material={materials.M_wood_dark} */}
          {/*   /> */}
          {/*   <mesh */}
          {/*     name="lp005_barrel_0002_2" */}
          {/*     geometry={nodes.lp005_barrel_0002_2.geometry} */}
          {/*     material={materials.M_wood_light} */}
          {/*   /> */}
          {/* </group> */}
          {/* <group */}
          {/*   name="visual_barrel_bumpers002" */}
          {/*   position={[-4.753, -1.561, -6.47]} */}
          {/* > */}
          {/*   <mesh */}
          {/*     name="lp005_barrel_0003" */}
          {/*     geometry={nodes.lp005_barrel_0003.geometry} */}
          {/*     material={materials.M_wood_medium} */}
          {/*   /> */}
          {/*   <mesh */}
          {/*     name="lp005_barrel_0003_1" */}
          {/*     geometry={nodes.lp005_barrel_0003_1.geometry} */}
          {/*     material={materials.M_wood_dark} */}
          {/*   /> */}
          {/*   <mesh */}
          {/*     name="lp005_barrel_0003_2" */}
          {/*     geometry={nodes.lp005_barrel_0003_2.geometry} */}
          {/*     material={materials.M_wood_light} */}
          {/*   /> */}
          {/* </group> */}
          <mesh
            name="visual_habit_vuk"
            geometry={nodes.visual_habit_vuk.geometry}
            material={materials.M_metal}
            position={[6.947, 6.049, -21.278]}
          />
          <mesh
            name="visual_base_habit_vuk"
            geometry={nodes.visual_base_habit_vuk.geometry}
            material={materials.M_pipe}
            position={[6.947, 6.049, -21.278]}
          />
          <mesh
            name="visual_hight_playfield"
            geometry={nodes.visual_hight_playfield.geometry}
            material={materials["M_stone_light.004"]}
            position={[2.084, -2.882, -17.598]}
          />
          <mesh
            name="visual_faquir_plank001"
            geometry={nodes.visual_faquir_plank001.geometry}
            material={materials["M_stone_medium.009"]}
            position={[9.866, -2.882, -14.48]}
          />
          {/* <mesh */}
          {/*   name="visual_faquir_plank002" */}
          {/*   geometry={nodes.visual_faquir_plank002.geometry} */}
          {/*   material={materials["M_stone_medium.008"]} */}
          {/*   position={[6.394, -0.452, -12.896]} */}
          {/* /> */}
          <mesh
            name="visual_faquir_plank003"
            geometry={nodes.visual_faquir_plank003.geometry}
            material={materials["M_stone_medium.007"]}
            position={[9.134, -0.452, -12.781]}
          />
          <mesh
            name="visual_faquir_plank004"
            geometry={nodes.visual_faquir_plank004.geometry}
            material={materials["M_stone_medium.006"]}
            position={[7.995, -0.452, -10.223]}
          />
          <mesh
            name="visual_faquir_plank005"
            geometry={nodes.visual_faquir_plank005.geometry}
            material={materials["M_stone_light.006"]}
            position={[7.527, -0.452, -6]}
          />
          <mesh
            name="visual_faquir_plank006"
            geometry={nodes.visual_faquir_plank006.geometry}
            material={materials["M_stone_medium.005"]}
            position={[8.799, -0.452, -8.033]}
          />
          <mesh
            name="visual_faquir_plank007"
            geometry={nodes.visual_faquir_plank007.geometry}
            material={materials["M_stone_medium.004"]}
            position={[7.12, -0.452, -3.509]}
          />
          <group name="visual_mine" position={[-9.978, -1.495, 5.084]}>
            <mesh
              name="light1_Lamp_0"
              geometry={nodes.light1_Lamp_0.geometry}
              material={materials.M_rock}
            />
            <mesh
              name="light1_Lamp_0_1"
              geometry={nodes.light1_Lamp_0_1.geometry}
              material={materials.M_wood_light}
            />
            <mesh
              name="light1_Lamp_0_2"
              geometry={nodes.light1_Lamp_0_2.geometry}
              material={materials.M_wood_medium}
            />
            <mesh
              name="light1_Lamp_0_3"
              geometry={nodes.light1_Lamp_0_3.geometry}
              material={materials.M_stone_medium}
            />
            <mesh
              name="light1_Lamp_0_4"
              geometry={nodes.light1_Lamp_0_4.geometry}
              material={materials["M_wood_dark.002"]}
            />
            <mesh
              name="light1_Lamp_0_5"
              geometry={nodes.light1_Lamp_0_5.geometry}
              material={materials.M_wool}
            />
            <mesh
              name="light1_Lamp_0_6"
              geometry={nodes.light1_Lamp_0_6.geometry}
              material={materials.M_roof}
            />
            <mesh
              name="light1_Lamp_0_7"
              geometry={nodes.light1_Lamp_0_7.geometry}
              material={materials.M_stone_light}
            />
            <mesh
              name="light1_Lamp_0_8"
              geometry={nodes.light1_Lamp_0_8.geometry}
              material={materials["Material.001"]}
            />
          </group>
          {/* <group name="visual_mine_plank001" position={[-9.978, -1.495, 5.084]}> */}
          {/*   <mesh */}
          {/*     name="light1_Lamp_0002" */}
          {/*     geometry={nodes.light1_Lamp_0002.geometry} */}
          {/*     material={materials.M_wood_medium} */}
          {/*   /> */}
          {/*   <mesh */}
          {/*     name="light1_Lamp_0002_1" */}
          {/*     geometry={nodes.light1_Lamp_0002_1.geometry} */}
          {/*     material={materials.M_stone_medium} */}
          {/*   /> */}
          {/* </group> */}
          {/* <group name="visual_mine_plank002" position={[-9.978, -1.495, 5.084]}> */}
          {/*   <mesh */}
          {/*     name="light1_Lamp_0003" */}
          {/*     geometry={nodes.light1_Lamp_0003.geometry} */}
          {/*     material={materials.M_wood_medium} */}
          {/*   /> */}
          {/*   <mesh */}
          {/*     name="light1_Lamp_0003_1" */}
          {/*     geometry={nodes.light1_Lamp_0003_1.geometry} */}
          {/*     material={materials.M_stone_medium} */}
          {/*   /> */}
          {/* </group> */}
          {/* <group name="visual_mine_plank003" position={[-9.978, -1.495, 5.084]}> */}
          {/*   <mesh */}
          {/*     name="light1_Lamp_0004" */}
          {/*     geometry={nodes.light1_Lamp_0004.geometry} */}
          {/*     material={materials.M_wood_medium} */}
          {/*   /> */}
          {/*   <mesh */}
          {/*     name="light1_Lamp_0004_1" */}
          {/*     geometry={nodes.light1_Lamp_0004_1.geometry} */}
          {/*     material={materials.M_stone_medium} */}
          {/*   /> */}
          {/* </group> */}
          {/* <mesh */}
          {/*   name="visual_ruby002" */}
          {/*   geometry={nodes.visual_ruby002.geometry} */}
          {/*   material={materials.M_red_ruby} */}
          {/*   position={[-4.739, 0.412, -6.466]} */}
          {/* /> */}
          {/* <mesh */}
          {/*   name="visual_ruby003" */}
          {/*   geometry={nodes.visual_ruby003.geometry} */}
          {/*   material={materials.M_green_ruby} */}
          {/*   position={[-6.642, 0.412, -12.848]} */}
          {/* /> */}
          {/* <mesh */}
          {/*   name="visual_ruby001" */}
          {/*   geometry={nodes.visual_ruby001.geometry} */}
          {/*   material={materials.M_blue_ruby} */}
          {/*   position={[1.11, 0.412, -11.152]} */}
          {/* /> */}
          <group name="visual_ramp_back2" position={[-9.422, -1.235, 4.322]}>
            <mesh
              name="model_2006"
              geometry={nodes.model_2006.geometry}
              material={materials["M_stone_light.001"]}
            />
            <mesh
              name="model_2006_1"
              geometry={nodes.model_2006_1.geometry}
              material={materials["M_stone_medium.001"]}
            />
          </group>
          <group name="visual_super_rubber" position={[-0.768, -1.898, 19.715]}>
            <mesh
              name="Circle"
              geometry={nodes.Circle.geometry}
              material={materials.M_roof}
            />
            <mesh
              name="Circle_1"
              geometry={nodes.Circle_1.geometry}
              material={materials.M_metal}
            />
            <mesh
              name="Circle_2"
              geometry={nodes.Circle_2.geometry}
              material={materials.M_yellow}
            />
            <mesh
              name="Circle_3"
              geometry={nodes.Circle_3.geometry}
              material={materials.M_stone_medium}
            />
            <mesh
              name="Circle_4"
              geometry={nodes.Circle_4.geometry}
              material={materials.M_stone_light}
            />
          </group>
          <group name="visual_faquir" position={[10.805, -2.882, -13.695]}>
            <mesh
              name="Mesh004"
              geometry={nodes.Mesh004.geometry}
              material={materials["M_wood_medium.001"]}
            />
            <mesh
              name="Mesh004_1"
              geometry={nodes.Mesh004_1.geometry}
              material={materials["M_wood_dark.001"]}
            />
            <mesh
              name="Mesh004_2"
              geometry={nodes.Mesh004_2.geometry}
              material={materials["M_roof.001"]}
            />
            <mesh
              name="Mesh004_3"
              geometry={nodes.Mesh004_3.geometry}
              material={materials["M_stone_light.003"]}
            />
          </group>
          <mesh
            name="visual_field"
            geometry={nodes.visual_field.geometry}
            material={materials.M_grass}
            position={[-0.166, -1.551, -0.702]}
          />
          <group name="visual_cannon" position={[3.1, 0.08, -19.239]}>
            <mesh
              name="Cube002"
              geometry={nodes.Cube002.geometry}
              material={materials.M_yellow}
            />
            <mesh
              name="Cube002_1"
              geometry={nodes.Cube002_1.geometry}
              material={materials.M_black}
            />
            <mesh
              name="Cube002_2"
              geometry={nodes.Cube002_2.geometry}
              material={materials["M_stone_light.005"]}
            />
            <mesh
              name="Cube002_3"
              geometry={nodes.Cube002_3.geometry}
              material={materials["M_stone_medium.003"]}
            />
          </group>
          <group name="visual_castle" position={[11.147, -0.805, 8.481]}>
            <mesh
              name="model_6001"
              geometry={nodes.model_6001.geometry}
              material={materials["M_stone_light.002"]}
            />
            <mesh
              name="model_6001_1"
              geometry={nodes.model_6001_1.geometry}
              material={materials["M_wood_light.001"]}
            />
            <mesh
              name="model_6001_2"
              geometry={nodes.model_6001_2.geometry}
              material={materials["M_wood_medium.002"]}
            />
            <mesh
              name="model_6001_3"
              geometry={nodes.model_6001_3.geometry}
              material={materials["M_wood_dark.003"]}
            />
            <mesh
              name="model_6001_4"
              geometry={nodes.model_6001_4.geometry}
              material={materials.M_window}
            />
            <mesh
              name="model_6001_5"
              geometry={nodes.model_6001_5.geometry}
              material={materials.M_primary}
            />
            <mesh
              name="model_6001_6"
              geometry={nodes.model_6001_6.geometry}
              material={materials["M_roof.002"]}
            />
            <mesh
              name="model_6001_7"
              geometry={nodes.model_6001_7.geometry}
              material={materials["M_metal.001"]}
            />
            <mesh
              name="model_6001_8"
              geometry={nodes.model_6001_8.geometry}
              material={materials["M_stone_medium.002"]}
            />
          </group>
          <mesh
            name="visual_hight_playfield_bars_top"
            geometry={nodes.visual_hight_playfield_bars_top.geometry}
            material={materials["M_metal.003"]}
            position={[2.423, -2.881, -18.566]}
          />
          <mesh
            name="visual_super_rubber_class_coin"
            geometry={nodes.visual_super_rubber_class_coin.geometry}
            material={materials.M_in_coll}
            position={[5.517, -1.362, 19.445]}
          />
          <group name="visual_drum" position={[6.458, -2.032, -8.978]}>
            <mesh
              name="Cylinder004"
              geometry={nodes.Cylinder004.geometry}
              material={materials.M_wood_light}
            />
            <mesh
              name="Cylinder004_1"
              geometry={nodes.Cylinder004_1.geometry}
              material={materials.M_wood_medium}
            />
            <mesh
              name="Cylinder004_2"
              geometry={nodes.Cylinder004_2.geometry}
              material={materials.M_wood_dark}
            />
            <mesh
              name="Cylinder004_3"
              geometry={nodes.Cylinder004_3.geometry}
              material={materials.M_drum}
            />
          </group>
          <group name="visual_drum001" position={[6.348, -2.032, -10.662]}>
            <mesh
              name="Cylinder007"
              geometry={nodes.Cylinder007.geometry}
              material={materials.M_wood_light}
            />
            <mesh
              name="Cylinder007_1"
              geometry={nodes.Cylinder007_1.geometry}
              material={materials.M_wood_medium}
            />
            <mesh
              name="Cylinder007_2"
              geometry={nodes.Cylinder007_2.geometry}
              material={materials.M_wood_dark}
            />
            <mesh
              name="Cylinder007_3"
              geometry={nodes.Cylinder007_3.geometry}
              material={materials.M_drum}
            />
          </group>
          <group name="visual_drum002" position={[6.089, -2.032, -12.319]}>
            <mesh
              name="Cylinder008"
              geometry={nodes.Cylinder008.geometry}
              material={materials.M_wood_light}
            />
            <mesh
              name="Cylinder008_1"
              geometry={nodes.Cylinder008_1.geometry}
              material={materials.M_wood_medium}
            />
            <mesh
              name="Cylinder008_2"
              geometry={nodes.Cylinder008_2.geometry}
              material={materials.M_wood_dark}
            />
            <mesh
              name="Cylinder008_3"
              geometry={nodes.Cylinder008_3.geometry}
              material={materials.M_drum}
            />
          </group>
          <group name="visual_drum003" position={[6.199, -2.032, -7.173]}>
            <mesh
              name="Cylinder009"
              geometry={nodes.Cylinder009.geometry}
              material={materials.M_wood_light}
            />
            <mesh
              name="Cylinder009_1"
              geometry={nodes.Cylinder009_1.geometry}
              material={materials.M_wood_medium}
            />
            <mesh
              name="Cylinder009_2"
              geometry={nodes.Cylinder009_2.geometry}
              material={materials.M_wood_dark}
            />
            <mesh
              name="Cylinder009_3"
              geometry={nodes.Cylinder009_3.geometry}
              material={materials.M_drum}
            />
          </group>
          <mesh
            name="visual_faquir_bars_bottom"
            geometry={nodes.visual_faquir_bars_bottom.geometry}
            material={materials["M_metal.002"]}
            position={[6.6, -2.881, -2.456]}
          />
          <group name="visual_tree" position={[14.697, 4.38, 1.526]}>
            <mesh
              name="model_0002"
              geometry={nodes.model_0002.geometry}
              material={materials.M_wood_dark}
            />
            <mesh
              name="model_0002_1"
              geometry={nodes.model_0002_1.geometry}
              material={materials.M_tree}
            />
          </group>
          <mesh
            name="visual_super_rubber_class_coin_plane_bottom"
            geometry={
              nodes.visual_super_rubber_class_coin_plane_bottom.geometry
            }
            material={
              nodes.visual_super_rubber_class_coin_plane_bottom.material
            }
            position={[5.517, -1.362, 19.445]}
          />
          <group name="visual_sword" position={[0, -0.762, 0]}>
            <mesh
              name="defaultMaterial"
              geometry={nodes.defaultMaterial.geometry}
              material={materials.Blade}
            />
            <mesh
              name="defaultMaterial_1"
              geometry={nodes.defaultMaterial_1.geometry}
              material={materials.Hilt}
            />
          </group>
          {/* <mesh */}
          {/*   name="coll_flipper_left_bottom" */}
          {/*   geometry={nodes.coll_flipper_left_bottom.geometry} */}
          {/*   material={nodes.coll_flipper_left_bottom.material} */}
          {/*   position={[-5.001, -2.901, 26.34]} */}
          {/* /> */}
          {/* <mesh */}
          {/*   name="coll_flipper_right_bottom" */}
          {/*   geometry={nodes.coll_flipper_right_bottom.geometry} */}
          {/*   material={nodes.coll_flipper_right_bottom.material} */}
          {/*   position={[2.787, -2.901, 26.34]} */}
          {/* /> */}
          {/* <mesh */}
          {/*   name="coll_gate" */}
          {/*   geometry={nodes.coll_gate.geometry} */}
          {/*   material={nodes.coll_gate.material} */}
          {/*   position={[8.733, -1.272, 5.992]} */}
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
              name="coll_habit_vuk"
              visible={false}
              geometry={nodes.coll_habit_vuk.geometry}
              material={nodes.coll_habit_vuk.material}
              position={[6.947, 6.049, -21.278]}
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

          <RigidBody type="fixed" colliders="trimesh" includeInvisible>
            <mesh
              name="coll_metal"
              visible={false}
              geometry={nodes.coll_metal.geometry}
              material={nodes.coll_metal.material}
              position={[0.313, -2.424, 23.779]}
            />
            <mesh
              name="coll_ramp_metal"
              visible={false}
              geometry={nodes.coll_ramp_metal.geometry}
              material={nodes.coll_ramp_metal.material}
              position={[-1.088, -2.185, 21.588]}
            />
            <mesh
              name="coll_left_hole_sidewalls"
              visible={false}
              geometry={nodes.coll_left_hole_sidewalls.geometry}
              material={nodes.coll_left_hole_sidewalls.material}
              position={[-0.557, -2.233, 8.325]}
            />
            {/* <mesh */}
            {/*   name="coll_left_kickback_door" */}
            {/*   geometry={nodes.coll_left_kickback_door.geometry} */}
            {/*   material={nodes.coll_left_kickback_door.material} */}
            {/*   position={[-13.574, -2.233, 23.626]} */}
            {/* /> */}
            <mesh
              name="coll_posts_outlane"
              visible={false}
              geometry={nodes.coll_posts_outlane.geometry}
              material={nodes.coll_posts_outlane.material}
              position={[-2.08, -2.233, 16.425]}
            />
            <mesh
              name="coll_left_hole"
              visible={false}
              geometry={nodes.coll_left_hole.geometry}
              material={nodes.coll_left_hole.material}
              position={[-12.556, -5.859, 5.794]}
            />
            {/* <mesh */}
            {/*   name="coll_left_sling_collision" */}
            {/*   geometry={nodes.coll_left_sling_collision.geometry} */}
            {/*   material={nodes.coll_left_sling_collision.material} */}
            {/*   position={[-7.708, -2.233, 16.596]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_right_sling_collision" */}
            {/*   geometry={nodes.coll_right_sling_collision.geometry} */}
            {/*   material={nodes.coll_right_sling_collision.material} */}
            {/*   position={[5.493, -2.185, 16.596]} */}
            {/* /> */}
            <mesh
              name="coll_super_rubber"
              visible={false}
              geometry={nodes.coll_super_rubber.geometry}
              material={nodes.coll_super_rubber.material}
              position={[-2.105, 0.799, 0.974]}
            />
            {/* <mesh */}
            {/*   name="coll_standard_collision" */}
            {/*   geometry={nodes.coll_standard_collision.geometry} */}
            {/*   material={nodes.coll_standard_collision.material} */}
            {/*   position={[-0.633, -1.467, 7.78]} */}
            {/* /> */}
            <mesh
              name="coll_rubber"
              visible={false}
              geometry={nodes.coll_rubber.geometry}
              material={nodes.coll_rubber.material}
              position={[-2.097, -0.236, -1.55]}
            />
            <mesh
              name="coll_standard_collision_sidewalls_back"
              visible={false}
              geometry={nodes.coll_standard_collision_sidewalls_back.geometry}
              material={nodes.coll_standard_collision_sidewalls_back.material}
              position={[-0.633, -10.856, 7.78]}
            />
            {/* <mesh */}
            {/*   name="coll_playfield_collision_left_hole" */}
            {/*   geometry={nodes.coll_playfield_collision_left_hole.geometry} */}
            {/*   material={nodes.coll_playfield_collision_left_hole.material} */}
            {/*   position={[-0.609, -2.903, 7.762]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_ramp_back_test" */}
            {/*   geometry={nodes.coll_ramp_back_test.geometry} */}
            {/*   material={materials.collision} */}
            {/*   position={[-0.609, -2.903, 5.131]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_scoop_hole_left" */}
            {/*   geometry={nodes.coll_scoop_hole_left.geometry} */}
            {/*   material={nodes.coll_scoop_hole_left.material} */}
            {/*   position={[-5.444, -4.23, -2.829]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_visual_habit_right_9_top" */}
            {/*   geometry={nodes.coll_visual_habit_right_9_top.geometry} */}
            {/*   material={nodes.coll_visual_habit_right_9_top.material} */}
            {/*   position={[0.143, -4.465, -2.19]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_visual_habit_right_left_9_top002" */}
            {/*   geometry={nodes.coll_visual_habit_right_left_9_top002.geometry} */}
            {/*   material={nodes.coll_visual_habit_right_left_9_top002.material} */}
            {/*   position={[0.143, -4.465, -2.19]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_right_kickback_door001" */}
            {/*   geometry={nodes.coll_right_kickback_door001.geometry} */}
            {/*   material={materials.collision} */}
            {/*   position={[8.465, -1.97, 25.481]} */}
            {/* /> */}
            <mesh
              name="coll_visual_mpf_metal_wires_11"
              visible={false}
              geometry={nodes.coll_visual_mpf_metal_wires_11.geometry}
              material={materials.collision}
              position={[2.609, -0.768, 0.974]}
            />
            {/* <mesh */}
            {/*   name="coll_bumpers001" */}
            {/*   geometry={nodes.coll_bumpers001.geometry} */}
            {/*   material={nodes.coll_bumpers001.material} */}
            {/*   position={[1.112, -1.6, -11.134]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_bumpers002" */}
            {/*   geometry={nodes.coll_bumpers002.geometry} */}
            {/*   material={nodes.coll_bumpers002.material} */}
            {/*   position={[-4.744, -1.6, -6.463]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_bumpers003" */}
            {/*   geometry={nodes.coll_bumpers003.geometry} */}
            {/*   material={nodes.coll_bumpers003.material} */}
            {/*   position={[-6.635, -1.6, -12.845]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_habit_vuk" */}
            {/*   geometry={nodes.coll_habit_vuk.geometry} */}
            {/*   material={nodes.coll_habit_vuk.material} */}
            {/*   position={[6.947, 6.049, -21.278]} */}
            {/* /> */}
            <mesh
              name="coll_sidewalls001"
              visible={false}
              geometry={nodes.coll_sidewalls001.geometry}
              material={nodes.coll_sidewalls001.material}
              position={[-0.557, -2.126, 8.325]}
            />
            {/* <mesh */}
            {/*   name="coll_faquir" */}
            {/*   geometry={nodes.coll_faquir.geometry} */}
            {/*   material={nodes.coll_faquir.material} */}
            {/*   position={[10.805, -2.882, -13.695]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_hight_playfield" */}
            {/*   geometry={nodes.coll_hight_playfield.geometry} */}
            {/*   material={nodes.coll_hight_playfield.material} */}
            {/*   position={[2.084, -2.882, -17.598]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_faquir_plank001" */}
            {/*   geometry={nodes.coll_faquir_plank001.geometry} */}
            {/*   material={nodes.coll_faquir_plank001.material} */}
            {/*   position={[9.866, -2.882, -14.48]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_faquir_plank003" */}
            {/*   geometry={nodes.coll_faquir_plank003.geometry} */}
            {/*   material={nodes.coll_faquir_plank003.material} */}
            {/*   position={[9.134, -0.452, -12.781]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_faquir_plank002" */}
            {/*   geometry={nodes.coll_faquir_plank002.geometry} */}
            {/*   material={nodes.coll_faquir_plank002.material} */}
            {/*   position={[6.394, -0.452, -12.896]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_faquir_plank004" */}
            {/*   geometry={nodes.coll_faquir_plank004.geometry} */}
            {/*   material={nodes.coll_faquir_plank004.material} */}
            {/*   position={[7.995, -0.452, -10.223]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_faquir_plank005" */}
            {/*   geometry={nodes.coll_faquir_plank005.geometry} */}
            {/*   material={nodes.coll_faquir_plank005.material} */}
            {/*   position={[7.527, -0.452, -6]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_faquir_plank006" */}
            {/*   geometry={nodes.coll_faquir_plank006.geometry} */}
            {/*   material={nodes.coll_faquir_plank006.material} */}
            {/*   position={[8.799, -0.452, -8.033]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_faquir_plank007" */}
            {/*   geometry={nodes.coll_faquir_plank007.geometry} */}
            {/*   material={nodes.coll_faquir_plank007.material} */}
            {/*   position={[7.12, -0.452, -3.509]} */}
            {/* /> */}
            {/* <mesh */}
            {/*   name="coll_mine_gate" */}
            {/*   geometry={nodes.coll_mine_gate.geometry} */}
            {/*   material={nodes.coll_mine_gate.material} */}
            {/*   position={[-11.672, -1.9, 6.777]} */}
            {/* /> */}
            <mesh
              name="coll_sidewalls002"
              visible={false}
              geometry={nodes.coll_sidewalls002.geometry}
              material={nodes.coll_sidewalls002.material}
              position={[-0.557, -2.233, 8.325]}
            />
            <mesh
              name="coll_cannon"
              visible={false}
              geometry={nodes.coll_cannon.geometry}
              material={nodes.coll_cannon.material}
              position={[3.1, 0.08, -19.239]}
            />
            <mesh
              name="coll_faquir_bars_bottom"
              visible={false}
              geometry={nodes.coll_faquir_bars_bottom.geometry}
              material={nodes.coll_faquir_bars_bottom.material}
              position={[10.805, -2.882, -13.695]}
            />
            <mesh
              name="coll_hight_playfield_bars_top"
              visible={false}
              geometry={nodes.coll_hight_playfield_bars_top.geometry}
              material={nodes.coll_hight_playfield_bars_top.material}
              position={[2.084, -2.882, -17.598]}
            />
            <mesh
              name="coll_faquir_glass_panel001"
              visible={false}
              geometry={nodes.coll_faquir_glass_panel001.geometry}
              material={nodes.coll_faquir_glass_panel001.material}
              position={[10.805, -2.882, -13.695]}
            />
            <mesh
              name="coll_glass_panel001"
              visible={false}
              geometry={nodes.coll_glass_panel001.geometry}
              material={nodes.coll_glass_panel001.material}
              position={[3.1, 0.08, -19.239]}
            />
          </RigidBody>
          {/* <mesh */}
          {/*   name="visual_lg_10x" */}
          {/*   geometry={nodes.visual_lg_10x.geometry} */}
          {/*   material={materials.lamp_playfield} */}
          {/*   position={[9.292, -1.591, 25.651]} */}
          {/* /> */}
        </group>
      </group>
    </>
  );
}

useGLTF.preload("/models/Pinball_BaseFinal.glb");
