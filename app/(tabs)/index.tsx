import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import { Audio } from "expo-av";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SPACESHIP_SIZE = 50;
const SPEED = 5;
const ASTEROID_SIZE = 50;
const PLANET_SIZE = 70;

// Load assets
const spaceshipImg = require("../../assets/spaceship.png");
const asteroidImg = require("../../assets/asteroid.png");
const planetImg = require("../../assets/planet.png");
const bgImg = require("../../assets/space-bg.jpg");
const explosionSound = require("../../assets/explosion.mp3");
const victorySound = require("../../assets/victory.mp3");

const getRandomPosition = () => ({
  x: Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE),
  y: Math.random() * (SCREEN_HEIGHT - ASTEROID_SIZE),
});

const getRandomDirection = () => ({
  dx: (Math.random() - 0.5) * 2,
  dy: (Math.random() - 0.5) * 2,
});

export default function SpaceGame() {
  const [position, setPosition] = useState({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 });
  const [asteroids, setAsteroids] = useState([
    { ...getRandomPosition(), ...getRandomDirection() },
    { ...getRandomPosition(), ...getRandomDirection() },
  ]);
  const [planet, setPlanet] = useState(getRandomPosition());
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Load sound effects
  const playSound = async (soundFile: any) => {
    const { sound } = await Audio.Sound.createAsync(soundFile);
    await sound.playAsync();
  };

  useEffect(() => {
    if (gameOver || win) return;

    const subscription = Accelerometer.addListener(({ x, y }) => {
      setPosition((prev) => {
        let newX = prev.x + x * SPEED;
        let newY = prev.y - y * SPEED;

        newX = Math.max(SPACESHIP_SIZE / 2, Math.min(SCREEN_WIDTH - SPACESHIP_SIZE / 2, newX));
        newY = Math.max(SPACESHIP_SIZE / 2, Math.min(SCREEN_HEIGHT - SPACESHIP_SIZE / 2, newY));

        return { x: newX, y: newY };
      });
    });

    return () => subscription.remove();
  }, [gameOver, win]);

  // Move asteroids smoothly
  useEffect(() => {
    if (gameOver || win) return;

    const moveAsteroids = () => {
      setAsteroids((prev) =>
        prev.map((a) => {
          let newX = a.x + a.dx * SPEED;
          let newY = a.y + a.dy * SPEED;

          if (newX <= 0 || newX >= SCREEN_WIDTH - ASTEROID_SIZE) a.dx *= -1;
          if (newY <= 0 || newY >= SCREEN_HEIGHT - ASTEROID_SIZE) a.dy *= -1;

          return { ...a, x: newX, y: newY };
        })
      );
      animationRef.current = requestAnimationFrame(moveAsteroids);
    };

    animationRef.current = requestAnimationFrame(moveAsteroids);
    return () =>  {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [gameOver, win]);

  // Check for collisions
  useEffect(() => {
    if (gameOver || win) return;

    let isGameOver = asteroids.some(
      (a) => Math.abs(position.x - a.x) < ASTEROID_SIZE && Math.abs(position.y - a.y) < ASTEROID_SIZE
    );

    if (isGameOver) {
      setGameOver(true);
      playSound(explosionSound);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    if (Math.abs(position.x - planet.x) < PLANET_SIZE && Math.abs(position.y - planet.y) < PLANET_SIZE) {
      setWin(true);
      playSound(victorySound);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [position, asteroids, planet]);

  const resetGame = () => {
    setGameOver(false);
    setWin(false);
    setPosition({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 });
    setAsteroids([
      { ...getRandomPosition(), ...getRandomDirection() },
      { ...getRandomPosition(), ...getRandomDirection() },
    ]);
    setPlanet(getRandomPosition());
  };

  return (
    <ImageBackground source={bgImg} style={styles.background}>
      <View style={styles.container}>
        <Image
          source={spaceshipImg}
          style={[styles.spaceship, { left: position.x - SPACESHIP_SIZE / 2, top: position.y - SPACESHIP_SIZE / 2 }]}
        />
        {asteroids.map((a, i) => (
          <Image key={i} source={asteroidImg} style={[styles.asteroid, { left: a.x, top: a.y }]} />
        ))}
        <Image source={planetImg} style={[styles.planet, { left: planet.x, top: planet.y }]} />

        <Modal visible={gameOver || win} animationType="fade" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>{win ? "🚀 You Reached the Planet! 🌍" : "💥 Game Over! 💥"}</Text>
              <TouchableOpacity onPress={resetGame} style={styles.button}>
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
  },
  spaceship: {
    width: SPACESHIP_SIZE,
    height: SPACESHIP_SIZE,
    position: "absolute",
  },
  asteroid: {
    width: ASTEROID_SIZE,
    height: ASTEROID_SIZE,
    position: "absolute",
  },
  planet: {
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    position: "absolute",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});
