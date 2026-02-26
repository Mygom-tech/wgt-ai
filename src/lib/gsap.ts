'use client'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'

// Register plugins at module scope
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase)

// Custom eases for hero animations
CustomEase.create('hero.blurReveal', 'M0,0 C0.25,0.1 0.25,1 1,1')
CustomEase.create('hero.magnetSnap', 'M0,0 C0.2,1 0.4,1 1,1')

export { gsap, useGSAP, ScrollTrigger, SplitText, CustomEase }
