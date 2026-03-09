import { useState } from "react";
import { ExportToDialog } from "@/components/ExportToDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, Star, ShoppingCart, CheckCircle2, X, Eye, Plus,
  Atom, Flame, Orbit, Zap, Waves, Magnet, Wind, Droplets,
  Thermometer, Rocket, FlaskConical, Beaker, Download,
  ArrowRight, TrendingUp, Shield, Cpu, Clock, Heart,
  ChevronRight, BarChart3, Box
} from "lucide-react";

// ── Solver Catalog ──────────────────────────────────────────

interface Solver {
  id: string;
  name: string;
  description: string;
  category: "classical-mechanics" | "electromagnetism" | "thermodynamics" | "fluid-dynamics" | "quantum" | "relativity" | "organic-chemistry" | "inorganic-chemistry" | "physical-chemistry" | "computational-chemistry" | "stellar" | "orbital" | "cosmology" | "planetary";
  domain: "physics" | "chemistry" | "astrophysics";
  methods: string[];
  inputs: string[];
  outputs: string[];
  accuracy: string;
  performance: string;
  complexity: "O(n)" | "O(n²)" | "O(n³)" | "O(n log n)" | "O(2^n)";
  tags: string[];
  rating: number;
  downloads: number;
  version: string;
  language: string;
  license: string;
  equations: string[];
  useCases: string[];
}

const solverCatalog: Solver[] = [
  // ─── PHYSICS: Classical Mechanics ───
  {
    id: "s-01", name: "Newtonian N-Body Solver", description: "Symplectic integrator for gravitational N-body problems. Supports Barnes-Hut tree approximation for O(n log n) scaling. Energy-conserving over long timescales.",
    category: "classical-mechanics", domain: "physics", methods: ["Leapfrog", "Verlet", "Barnes-Hut"], inputs: ["masses[]", "positions[]", "velocities[]", "dt", "G"],
    outputs: ["trajectories[]", "energy_history", "angular_momentum"], accuracy: "1e-10 relative energy error per orbit", performance: "10K bodies @ 60fps",
    complexity: "O(n log n)", tags: ["gravity", "orbital", "simulation"], rating: 4.9, downloads: 28400, version: "3.2.1", language: "Rust/WASM", license: "MIT",
    equations: ["F = G·m₁·m₂/r²", "a = F/m", "x(t+dt) = 2x(t) - x(t-dt) + a·dt²"],
    useCases: ["Solar system simulation", "Galaxy merger modeling", "Satellite constellation design", "Asteroid deflection analysis"]
  },
  {
    id: "s-02", name: "Rigid Body Dynamics Engine", description: "Full 6-DOF rigid body simulator with collision detection (GJK+EPA), friction models, and constraint solving via sequential impulses.",
    category: "classical-mechanics", domain: "physics", methods: ["Sequential Impulse", "GJK", "EPA", "Euler Integration"], inputs: ["shapes[]", "masses[]", "inertia_tensors[]", "forces[]"],
    outputs: ["positions[]", "rotations[]", "contact_points[]", "impulses[]"], accuracy: "Sub-millimeter penetration depth", performance: "1000 bodies @ 120fps",
    complexity: "O(n²)", tags: ["collision", "physics-engine", "game-physics"], rating: 4.7, downloads: 42100, version: "5.0.0", language: "C++/WASM", license: "Apache 2.0",
    equations: ["τ = I·α", "L = I·ω", "v₂ = v₁ + J/m"],
    useCases: ["Game physics simulation", "Robotics planning", "Structural collapse analysis", "Vehicle dynamics"]
  },
  {
    id: "s-03", name: "Lagrangian Mechanics Solver", description: "Symbolic + numeric solver for systems described by generalized coordinates. Auto-derives equations of motion from Lagrangian via Euler-Lagrange equations.",
    category: "classical-mechanics", domain: "physics", methods: ["Euler-Lagrange", "Hamilton's Equations", "RK4"], inputs: ["lagrangian_expression", "generalized_coords[]", "constraints[]"],
    outputs: ["equations_of_motion[]", "trajectories[]", "phase_space_plot"], accuracy: "Exact symbolic + 1e-12 numeric", performance: "Up to 20 DOF real-time",
    complexity: "O(n³)", tags: ["analytical-mechanics", "symbolic", "constraints"], rating: 4.8, downloads: 15600, version: "2.1.0", language: "Python/JS", license: "MIT",
    equations: ["L = T - V", "d/dt(∂L/∂q̇) - ∂L/∂q = 0", "H = Σpᵢq̇ᵢ - L"],
    useCases: ["Double pendulum analysis", "Coupled oscillators", "Constrained mechanical systems", "Robotics inverse kinematics"]
  },
  // ─── PHYSICS: Electromagnetism ───
  {
    id: "s-04", name: "Maxwell FDTD Solver", description: "Finite-Difference Time-Domain solver for Maxwell's equations. Supports PML absorbing boundaries, dispersive materials, and near-to-far-field transforms.",
    category: "electromagnetism", domain: "physics", methods: ["Yee Grid", "PML", "TFSF", "Near-to-Far"], inputs: ["grid_size", "materials[]", "source_config", "boundary_conditions"],
    outputs: ["E_field[]", "H_field[]", "S_parameter", "far_field_pattern"], accuracy: "Second-order spatial/temporal", performance: "256³ grid @ 2.1 GFLOPS",
    complexity: "O(n³)", tags: ["electromagnetic", "antenna", "photonics"], rating: 4.6, downloads: 19200, version: "4.3.0", language: "C/WASM", license: "GPL-3.0",
    equations: ["∇×E = -∂B/∂t", "∇×H = J + ∂D/∂t", "∇·D = ρ", "∇·B = 0"],
    useCases: ["Antenna design", "Photonic crystal simulation", "EMI/EMC analysis", "Waveguide optimization"]
  },
  {
    id: "s-05", name: "Electrostatics FEM Solver", description: "Finite Element Method solver for Poisson/Laplace equations. Adaptive mesh refinement, higher-order elements, and GPU-accelerated assembly.",
    category: "electromagnetism", domain: "physics", methods: ["FEM", "Adaptive Mesh", "Conjugate Gradient"], inputs: ["geometry", "charge_distribution", "boundary_conditions", "dielectric_map"],
    outputs: ["potential_field", "electric_field", "capacitance_matrix", "energy"], accuracy: "0.01% with h-refinement", performance: "1M elements in 3s",
    complexity: "O(n log n)", tags: ["electrostatics", "capacitance", "FEM"], rating: 4.5, downloads: 12800, version: "2.8.0", language: "Rust/WASM", license: "MIT",
    equations: ["∇²φ = -ρ/ε₀", "E = -∇φ", "C = Q/V"],
    useCases: ["Capacitor design", "Semiconductor device simulation", "High-voltage insulation analysis", "Particle beam optics"]
  },
  // ─── PHYSICS: Thermodynamics ───
  {
    id: "s-06", name: "Heat Transfer Solver", description: "Transient and steady-state heat conduction/convection solver. Supports 1D/2D/3D geometries, phase change (Stefan problem), and radiation coupling.",
    category: "thermodynamics", domain: "physics", methods: ["Crank-Nicolson", "ADI", "Gauss-Seidel"], inputs: ["geometry", "thermal_conductivity_map", "heat_sources[]", "boundary_conditions"],
    outputs: ["temperature_field", "heat_flux", "thermal_resistance", "time_to_equilibrium"], accuracy: "0.1°C typical error", performance: "500K nodes real-time",
    complexity: "O(n)", tags: ["heat-transfer", "thermal", "conduction"], rating: 4.7, downloads: 21500, version: "3.5.2", language: "C++/WASM", license: "MIT",
    equations: ["∂T/∂t = α∇²T + Q/(ρcₚ)", "q = -k∇T", "Q_rad = εσA(T⁴-T∞⁴)"],
    useCases: ["Electronics cooling design", "Building thermal analysis", "Welding simulation", "3D printing thermal modeling"]
  },
  {
    id: "s-07", name: "Statistical Mechanics Engine", description: "Monte Carlo and Molecular Dynamics engine for statistical ensembles. Implements NVT, NPT, µVT ensembles with Nosé-Hoover thermostat.",
    category: "thermodynamics", domain: "physics", methods: ["Metropolis MC", "Molecular Dynamics", "Nosé-Hoover", "Replica Exchange"], inputs: ["potential_function", "particle_count", "temperature", "pressure"],
    outputs: ["thermodynamic_averages", "radial_distribution", "free_energy", "phase_diagram"], accuracy: "Converges with 1/√N sampling", performance: "100K particles @ 30fps",
    complexity: "O(n log n)", tags: ["statistical-mechanics", "monte-carlo", "phase-transition"], rating: 4.8, downloads: 16900, version: "2.4.0", language: "Rust/WASM", license: "Apache 2.0",
    equations: ["Z = Σe^(-βEᵢ)", "⟨A⟩ = (1/Z)Σ Aᵢe^(-βEᵢ)", "F = -kT ln Z"],
    useCases: ["Phase transition studies", "Polymer folding", "Crystal nucleation", "Critical phenomena analysis"]
  },
  // ─── PHYSICS: Fluid Dynamics ───
  {
    id: "s-08", name: "Navier-Stokes CFD Solver", description: "Incompressible Navier-Stokes solver using projection method. Supports adaptive mesh, turbulence models (k-ε, LES), and moving boundaries.",
    category: "fluid-dynamics", domain: "physics", methods: ["Projection Method", "Multigrid", "k-ε Turbulence", "LES"], inputs: ["domain_geometry", "inlet_velocity", "viscosity", "boundary_conditions"],
    outputs: ["velocity_field", "pressure_field", "streamlines", "drag_coefficient", "lift_coefficient"], accuracy: "2nd order space, 2nd order time", performance: "1M cells steady-state in 30s",
    complexity: "O(n)", tags: ["CFD", "fluid", "turbulence", "aerodynamics"], rating: 4.9, downloads: 34700, version: "6.1.0", language: "C/WASM", license: "LGPL-3.0",
    equations: ["ρ(∂v/∂t + v·∇v) = -∇p + μ∇²v + f", "∇·v = 0", "Re = ρvL/μ"],
    useCases: ["Airfoil design", "Pipe flow analysis", "Wind turbine optimization", "Blood flow simulation"]
  },
  {
    id: "s-09", name: "Lattice Boltzmann Fluid Solver", description: "Mesoscopic fluid solver ideal for complex geometries, porous media, and multiphase flows. GPU-accelerated D3Q19 lattice.",
    category: "fluid-dynamics", domain: "physics", methods: ["BGK", "MRT", "Shan-Chen Multiphase"], inputs: ["geometry_voxels", "inlet_conditions", "fluid_properties", "surface_tension"],
    outputs: ["velocity_field", "density_field", "permeability", "capillary_pressure"], accuracy: "2nd order for low Mach", performance: "512³ lattice @ 200 MLUPS",
    complexity: "O(n)", tags: ["lattice-boltzmann", "porous-media", "multiphase"], rating: 4.6, downloads: 11200, version: "3.0.1", language: "CUDA/WASM", license: "MIT",
    equations: ["fᵢ(x+eᵢ,t+1) = fᵢ(x,t) - (fᵢ-fᵢᵉᑫ)/τ", "ρ = Σfᵢ", "ρu = Σfᵢeᵢ"],
    useCases: ["Porous media flow", "Droplet dynamics", "Microfluidics design", "Oil reservoir simulation"]
  },
  // ─── PHYSICS: Quantum ───
  {
    id: "s-10", name: "Schrödinger Equation Solver", description: "Time-dependent and time-independent Schrödinger equation solver. Supports 1D/2D/3D potentials, tunneling, and multi-particle entanglement.",
    category: "quantum", domain: "physics", methods: ["Split-Operator FFT", "Crank-Nicolson", "Variational"], inputs: ["potential_function", "initial_wavefunction", "hbar", "mass", "grid_params"],
    outputs: ["wavefunction_evolution", "probability_density", "energy_spectrum", "expectation_values"], accuracy: "Machine precision for eigenstates", performance: "1024² grid real-time",
    complexity: "O(n log n)", tags: ["quantum", "wavefunction", "tunneling"], rating: 4.9, downloads: 23100, version: "4.0.0", language: "Rust/WASM", license: "MIT",
    equations: ["iℏ∂ψ/∂t = Ĥψ", "Ĥ = -ℏ²/(2m)∇² + V(x)", "⟨A⟩ = ⟨ψ|Â|ψ⟩"],
    useCases: ["Quantum well design", "Tunneling probability calculation", "Hydrogen atom orbitals", "Quantum harmonic oscillator"]
  },
  {
    id: "s-11", name: "Quantum Circuit Simulator", description: "State vector and density matrix simulator for quantum circuits. Supports up to 28 qubits, noise models, and common gate sets.",
    category: "quantum", domain: "physics", methods: ["State Vector", "Density Matrix", "Tensor Network"], inputs: ["circuit_definition", "initial_state", "noise_model", "measurement_basis"],
    outputs: ["final_state", "measurement_probabilities", "fidelity", "entanglement_entropy"], accuracy: "Exact for state vector", performance: "24 qubits @ 1000 circuits/s",
    complexity: "O(2^n)", tags: ["quantum-computing", "qubits", "entanglement"], rating: 4.7, downloads: 18500, version: "2.6.0", language: "TypeScript", license: "Apache 2.0",
    equations: ["|ψ'⟩ = U|ψ⟩", "ρ' = UρU†", "S = -Tr(ρ log ρ)"],
    useCases: ["Quantum algorithm testing", "Error correction research", "Entanglement studies", "Quantum ML prototyping"]
  },
  // ─── PHYSICS: Relativity ───
  {
    id: "s-12", name: "Geodesic Raytracer", description: "General relativistic ray tracer for curved spacetime. Renders black holes, accretion disks, gravitational lensing, and wormholes with physically accurate photon trajectories.",
    category: "relativity", domain: "physics", methods: ["RK45 Geodesic Integration", "Kerr Metric", "Schwarzschild Metric"], inputs: ["metric_tensor", "observer_position", "camera_params", "accretion_model"],
    outputs: ["rendered_image", "photon_trajectories", "redshift_map", "shadow_boundary"], accuracy: "Sub-pixel geodesic accuracy", performance: "1080p @ 2fps (GPU)",
    complexity: "O(n²)", tags: ["black-hole", "gravitational-lensing", "visualization"], rating: 4.9, downloads: 31200, version: "3.1.0", language: "GLSL/WASM", license: "MIT",
    equations: ["d²xᵘ/dτ² + Γᵘᵥσ(dxᵛ/dτ)(dxσ/dτ) = 0", "ds² = gᵤᵥdxᵘdxᵛ", "Rᵤᵥ - ½gᵤᵥR = 8πGTᵤᵥ"],
    useCases: ["Black hole visualization", "Gravitational lensing simulation", "Accretion disk modeling", "Educational demonstrations"]
  },
  // ─── CHEMISTRY: Organic ───
  {
    id: "s-13", name: "Molecular Orbital Calculator", description: "Hartree-Fock and DFT-based molecular orbital calculator. Computes electron density, HOMO/LUMO, bond orders, and reaction energetics for organic molecules.",
    category: "organic-chemistry", domain: "chemistry", methods: ["Hartree-Fock", "DFT (B3LYP)", "MP2"], inputs: ["molecule_geometry", "basis_set", "charge", "multiplicity"],
    outputs: ["orbital_energies", "electron_density", "HOMO_LUMO_gap", "dipole_moment", "mulliken_charges"], accuracy: "±2 kcal/mol for reaction energies", performance: "50 atoms in 10s",
    complexity: "O(n³)", tags: ["quantum-chemistry", "DFT", "orbitals"], rating: 4.8, downloads: 26700, version: "5.2.0", language: "C++/WASM", license: "GPL-3.0",
    equations: ["Fφᵢ = εᵢφᵢ", "E[ρ] = T[ρ] + Vₑₓₜ[ρ] + J[ρ] + Exc[ρ]", "ρ(r) = Σ|φᵢ(r)|²"],
    useCases: ["Drug molecule design", "Reaction mechanism analysis", "Spectroscopy prediction", "Catalyst screening"]
  },
  {
    id: "s-14", name: "Reaction Kinetics Solver", description: "ODE-based chemical kinetics solver for complex reaction networks. Supports stiff systems, sensitivity analysis, and parameter fitting.",
    category: "organic-chemistry", domain: "chemistry", methods: ["LSODA", "BDF", "Sensitivity Analysis"], inputs: ["reaction_network", "rate_constants[]", "initial_concentrations[]", "temperature"],
    outputs: ["concentration_profiles", "reaction_rates", "half_lives", "sensitivity_coefficients"], accuracy: "1e-8 relative tolerance", performance: "1000 species network real-time",
    complexity: "O(n²)", tags: ["kinetics", "reaction-network", "ODE"], rating: 4.6, downloads: 14300, version: "3.8.0", language: "Rust/WASM", license: "MIT",
    equations: ["d[A]/dt = -k[A]ⁿ", "k = A·exp(-Ea/RT)", "t₁/₂ = ln2/k"],
    useCases: ["Pharmaceutical degradation", "Combustion chemistry", "Polymerization kinetics", "Enzyme kinetics"]
  },
  // ─── CHEMISTRY: Physical Chemistry ───
  {
    id: "s-15", name: "Equation of State Engine", description: "Multi-model thermodynamic equation of state solver. Peng-Robinson, van der Waals, Redlich-Kwong, and SAFT-VR for mixtures.",
    category: "physical-chemistry", domain: "chemistry", methods: ["Peng-Robinson", "SAFT-VR", "Soave-Redlich-Kwong"], inputs: ["components[]", "temperature", "pressure", "composition[]"],
    outputs: ["fugacity_coefficients", "compressibility_factor", "phase_envelope", "activity_coefficients"], accuracy: "±1% for vapor pressures", performance: "10K state points/s",
    complexity: "O(n²)", tags: ["thermodynamics", "EOS", "phase-equilibrium"], rating: 4.7, downloads: 17800, version: "4.1.0", language: "Rust/WASM", license: "Apache 2.0",
    equations: ["PV = nRT", "(P + a/V²)(V-b) = RT", "ln φᵢ = ∫₀ᴾ(Zᵢ-1)/P dP"],
    useCases: ["Process engineering", "Reservoir simulation", "Supercritical extraction", "Refrigerant design"]
  },
  {
    id: "s-16", name: "Electrochemistry Solver", description: "Butler-Volmer kinetics, Nernst equation, and impedance spectroscopy solver for batteries, fuel cells, and corrosion analysis.",
    category: "physical-chemistry", domain: "chemistry", methods: ["Butler-Volmer", "Nernst-Planck", "EIS Fitting"], inputs: ["electrode_materials", "electrolyte", "potential_range", "temperature"],
    outputs: ["current_voltage_curve", "impedance_spectrum", "diffusion_coefficient", "exchange_current"], accuracy: "±5 mV for standard potentials", performance: "Full CV in 0.5s",
    complexity: "O(n)", tags: ["battery", "fuel-cell", "corrosion"], rating: 4.5, downloads: 9800, version: "2.3.0", language: "TypeScript", license: "MIT",
    equations: ["E = E° - (RT/nF)ln Q", "i = i₀[exp(αₐFη/RT) - exp(-αcFη/RT)]", "Z = R + 1/(jωC)"],
    useCases: ["Battery design optimization", "Corrosion rate prediction", "Fuel cell MEA analysis", "Electroplating control"]
  },
  // ─── CHEMISTRY: Computational ───
  {
    id: "s-17", name: "Molecular Dynamics Engine", description: "Classical MD engine with GPU-accelerated force calculation. AMBER/CHARMM force fields, PME electrostatics, and enhanced sampling.",
    category: "computational-chemistry", domain: "chemistry", methods: ["Velocity Verlet", "PME", "SHAKE/RATTLE", "Metadynamics"], inputs: ["topology", "coordinates", "force_field", "simulation_params"],
    outputs: ["trajectory", "RMSD", "radial_distribution", "free_energy_surface"], accuracy: "Force field dependent (~1 kcal/mol)", performance: "100K atoms @ 50ns/day",
    complexity: "O(n log n)", tags: ["molecular-dynamics", "protein", "drug-design"], rating: 4.9, downloads: 38500, version: "7.0.0", language: "CUDA/WASM", license: "LGPL-3.0",
    equations: ["F = -∇V", "V = Σbonds + Σangles + Σdihedrals + ΣvdW + Σelec", "⟨A⟩ = lim(1/T)∫A(t)dt"],
    useCases: ["Protein folding simulation", "Drug binding analysis", "Membrane transport", "Material property prediction"]
  },
  // ─── ASTROPHYSICS: Stellar ───
  {
    id: "s-18", name: "Stellar Structure Solver", description: "Solves the four equations of stellar structure: hydrostatic equilibrium, mass continuity, energy transport, and energy generation. Models main sequence through red giant.",
    category: "stellar", domain: "astrophysics", methods: ["Henyey Method", "Shooting Method", "Opacity Tables"], inputs: ["mass", "composition", "age", "metallicity"],
    outputs: ["luminosity_profile", "temperature_profile", "density_profile", "HR_diagram_position", "lifetime"], accuracy: "±5% for main sequence lifetimes", performance: "Full evolution in 2s",
    complexity: "O(n²)", tags: ["stellar-evolution", "HR-diagram", "nucleosynthesis"], rating: 4.8, downloads: 14200, version: "3.4.0", language: "Fortran/WASM", license: "MIT",
    equations: ["dP/dr = -Gρm/r²", "dm/dr = 4πr²ρ", "dL/dr = 4πr²ρε", "dT/dr = -3κρL/(64πσr²T³)"],
    useCases: ["Star lifecycle modeling", "Supernova progenitor analysis", "White dwarf cooling curves", "Binary star evolution"]
  },
  {
    id: "s-19", name: "Nuclear Reaction Network", description: "Thermonuclear reaction network solver for stellar nucleosynthesis. 200+ isotopes, pp-chain, CNO cycle, triple-alpha, and r/s-process pathways.",
    category: "stellar", domain: "astrophysics", methods: ["Implicit ODE", "Nuclear Statistical Equilibrium", "Network Reduction"], inputs: ["temperature", "density", "initial_abundances", "network_size"],
    outputs: ["abundance_evolution", "energy_generation_rate", "nucleosynthesis_yields", "neutron_flux"], accuracy: "±10% for yields above Fe", performance: "Full network in 5s",
    complexity: "O(n²)", tags: ["nucleosynthesis", "nuclear", "supernova"], rating: 4.7, downloads: 8900, version: "2.1.0", language: "C/WASM", license: "Apache 2.0",
    equations: ["dYᵢ/dt = Σⱼrⱼ - Σₖdₖ", "ε = Σ(Δm)c² · rate", "4p → ⁴He + 2e⁺ + 2νₑ + 26.7MeV"],
    useCases: ["Supernova element production", "Big Bang nucleosynthesis", "Neutron star mergers", "Solar neutrino prediction"]
  },
  // ─── ASTROPHYSICS: Orbital ───
  {
    id: "s-20", name: "Keplerian Orbit Propagator", description: "High-precision orbit propagator with perturbations: J2-J6 harmonics, atmospheric drag, solar radiation pressure, third-body effects, and maneuver planning.",
    category: "orbital", domain: "astrophysics", methods: ["SGP4/SDP4", "Cowell's Method", "Encke's Method", "Lambert Solver"], inputs: ["TLE_or_state_vector", "epoch", "perturbation_models[]", "maneuver_plan"],
    outputs: ["ephemeris", "ground_track", "eclipse_times", "delta_v_budget", "conjunction_alerts"], accuracy: "±1 km LEO over 7 days", performance: "10K objects propagated in 1s",
    complexity: "O(n)", tags: ["orbit", "satellite", "space-debris"], rating: 4.9, downloads: 29600, version: "5.5.0", language: "Rust/WASM", license: "MIT",
    equations: ["r̈ = -μr/|r|³ + aₚ", "v = √(μ(2/r - 1/a))", "T = 2π√(a³/μ)"],
    useCases: ["Satellite mission design", "Space debris tracking", "Interplanetary trajectory", "Constellation optimization"]
  },
  {
    id: "s-21", name: "Three-Body Problem Solver", description: "Regularized three-body integrator using Kustaanheimo-Stiefel transformation. Handles close encounters, captures, and ejections with adaptive timestepping.",
    category: "orbital", domain: "astrophysics", methods: ["KS Regularization", "Bulirsch-Stoer", "Chain Regularization"], inputs: ["masses[3]", "positions[3]", "velocities[3]", "tolerance"],
    outputs: ["trajectories[3]", "Jacobi_constant", "Lyapunov_exponent", "escape_time"], accuracy: "1e-14 relative energy error", performance: "10M steps/s",
    complexity: "O(n²)", tags: ["three-body", "chaos", "celestial-mechanics"], rating: 4.8, downloads: 12400, version: "2.0.0", language: "C/WASM", license: "MIT",
    equations: ["CJ = -2U - v²", "Γ = lim(1/t)ln|δr(t)/δr(0)|", "d²rᵢ/dt² = -Σⱼ Gmⱼ(rᵢ-rⱼ)/|rᵢ-rⱼ|³"],
    useCases: ["Lagrange point analysis", "Binary star + planet stability", "Chaotic orbit visualization", "Gravitational slingshot design"]
  },
  // ─── ASTROPHYSICS: Cosmology ───
  {
    id: "s-22", name: "Friedmann Cosmology Solver", description: "Solves Friedmann equations for ΛCDM and alternative cosmological models. Computes expansion history, distances, and age of the universe.",
    category: "cosmology", domain: "astrophysics", methods: ["Friedmann Equations", "MCMC Parameter Estimation", "Fisher Matrix"], inputs: ["H0", "Omega_m", "Omega_Lambda", "Omega_k", "w"],
    outputs: ["scale_factor_evolution", "luminosity_distance", "angular_diameter_distance", "age_of_universe", "CMB_power_spectrum"], accuracy: "±0.1% for distances", performance: "Full evolution in 10ms",
    complexity: "O(n)", tags: ["cosmology", "dark-energy", "expansion"], rating: 4.7, downloads: 10300, version: "3.0.0", language: "TypeScript", license: "MIT",
    equations: ["H² = (8πG/3)ρ - k/a² + Λ/3", "ä/a = -(4πG/3)(ρ+3p) + Λ/3", "dL = (1+z)∫dz'/H(z')"],
    useCases: ["Dark energy constraints", "Cosmic distance ladder", "CMB analysis", "Supernova cosmology"]
  },
  // ─── ASTROPHYSICS: Planetary ───
  {
    id: "s-23", name: "Planetary Atmosphere Model", description: "1D/2D radiative-convective atmosphere model. Computes temperature profiles, spectra, and habitability metrics for exoplanets and solar system bodies.",
    category: "planetary", domain: "astrophysics", methods: ["Radiative Transfer", "Convective Adjustment", "Photochemistry"], inputs: ["stellar_spectrum", "planetary_params", "atmospheric_composition", "surface_properties"],
    outputs: ["temperature_profile", "emission_spectrum", "transmission_spectrum", "habitability_index"], accuracy: "±5K for Earth-like atmospheres", performance: "Full model in 3s",
    complexity: "O(n²)", tags: ["exoplanet", "atmosphere", "habitability"], rating: 4.6, downloads: 7800, version: "2.5.0", language: "Python/WASM", license: "Apache 2.0",
    equations: ["dF/dτ = F - B(T)", "F↑ - F↓ = σT⁴ₑff", "τ = ∫κρdz"],
    useCases: ["Exoplanet characterization", "Mars atmosphere modeling", "Greenhouse effect studies", "Transit spectroscopy prediction"]
  },
  {
    id: "s-24", name: "Tidal Evolution Solver", description: "Models tidal interactions between planets and moons. Computes orbital evolution, tidal heating, spin-orbit resonance capture, and tidal locking timescales.",
    category: "planetary", domain: "astrophysics", methods: ["Constant-Q Model", "Maxwell Viscoelastic", "Spin-Orbit Coupling"], inputs: ["primary_mass", "secondary_mass", "orbital_elements", "tidal_Q", "rigidity"],
    outputs: ["orbital_evolution", "tidal_heating_rate", "locking_timescale", "eccentricity_evolution"], accuracy: "±20% for heating rates", performance: "1 Gyr evolution in 2s",
    complexity: "O(n)", tags: ["tidal", "moon", "habitability", "io"], rating: 4.5, downloads: 5600, version: "1.8.0", language: "Rust/WASM", license: "MIT",
    equations: ["Ė = -21k₂n⁵R⁵e²/(2Q)", "ȧ = -6k₂n⁴R⁵(m₂/m₁)/(Q·a)", "τ_lock = Iω/(3k₂GM²R³/a⁶)"],
    useCases: ["Europa ocean modeling", "Io volcanism", "Exomoon habitability", "Earth-Moon history"]
  },
];

// ── Derived data ────────────────────────────────────────────

const domainConfig = {
  physics: { icon: Atom, label: "Physics", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  chemistry: { icon: FlaskConical, label: "Chemistry", color: "text-forge-amber", bg: "bg-forge-amber/10 border-forge-amber/20" },
  astrophysics: { icon: Orbit, label: "Astrophysics", color: "text-forge-cyan", bg: "bg-forge-cyan/10 border-forge-cyan/20" },
};

const categoryLabels: Record<string, string> = {
  "classical-mechanics": "Classical Mechanics", electromagnetism: "Electromagnetism",
  thermodynamics: "Thermodynamics", "fluid-dynamics": "Fluid Dynamics",
  quantum: "Quantum Mechanics", relativity: "Relativity",
  "organic-chemistry": "Organic Chemistry", "inorganic-chemistry": "Inorganic Chemistry",
  "physical-chemistry": "Physical Chemistry", "computational-chemistry": "Computational Chemistry",
  stellar: "Stellar Physics", orbital: "Orbital Mechanics",
  cosmology: "Cosmology", planetary: "Planetary Science",
};

const complexityColors: Record<string, string> = {
  "O(n)": "text-forge-emerald", "O(n log n)": "text-forge-cyan",
  "O(n²)": "text-forge-amber", "O(n³)": "text-forge-rose", "O(2^n)": "text-destructive",
};

// ── Components ──────────────────────────────────────────────

function SolverCard({ solver, onSelect, onAdd, inCart }: {
  solver: Solver; onSelect: () => void; onAdd: () => void; inCart: boolean;
}) {
  const domain = domainConfig[solver.domain];
  const DomainIcon = domain.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      className="glass rounded-xl p-5 cursor-pointer transition-all group relative"
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", domain.bg)}>
          <DomainIcon className={cn("h-5 w-5", domain.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{solver.name}</h3>
          <p className="text-[10px] text-muted-foreground">{categoryLabels[solver.category]}</p>
        </div>
        <Button
          variant={inCart ? "default" : "outline"}
          size="sm"
          className={cn("h-7 text-[10px] shrink-0 transition-all", inCart && "gradient-primary text-primary-foreground")}
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
        >
          {inCart ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Added</> : <><Plus className="h-3 w-3 mr-1" /> Add</>}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{solver.description}</p>

      {/* Metrics row */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-forge-amber text-forge-amber" /> {solver.rating}
        </span>
        <span className="flex items-center gap-1">
          <Download className="h-3 w-3" /> {(solver.downloads / 1000).toFixed(1)}K
        </span>
        <span className={cn("font-mono font-medium", complexityColors[solver.complexity])}>
          {solver.complexity}
        </span>
      </div>

      {/* Tags */}
      <div className="flex gap-1 flex-wrap">
        {solver.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">{tag}</Badge>
        ))}
      </div>

      {/* Equations preview on hover */}
      <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="mx-3 mb-3 p-2 rounded-lg bg-background/90 backdrop-blur-sm border border-border/50">
          <p className="text-[10px] font-mono text-muted-foreground truncate">{solver.equations[0]}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function SolverLibraryPage() {
  const [domain, setDomain] = useState<"all" | "physics" | "chemistry" | "astrophysics">("all");
  const [search, setSearch] = useState("");
  const [selectedSolver, setSelectedSolver] = useState<Solver | null>(null);
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"rating" | "downloads" | "name">("rating");

  const toggleCart = (id: string) => {
    setCart((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.info("Removed from project"); }
      else { next.add(id); toast.success("Added to project"); }
      return next;
    });
  };

  const filtered = solverCatalog
    .filter((s) => domain === "all" || s.domain === domain)
    .filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.includes(search.toLowerCase())) ||
      categoryLabels[s.category]?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "downloads") return b.downloads - a.downloads;
      return a.name.localeCompare(b.name);
    });

  const domainCounts = {
    all: solverCatalog.length,
    physics: solverCatalog.filter((s) => s.domain === "physics").length,
    chemistry: solverCatalog.filter((s) => s.domain === "chemistry").length,
    astrophysics: solverCatalog.filter((s) => s.domain === "astrophysics").length,
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] animate-fade-in">
      {/* Main content */}
      <div className={cn("flex-1 flex flex-col transition-all")}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Atom className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Solver Library</h1>
              <Badge variant="outline" className="text-[10px]">{solverCatalog.length} solvers</Badge>
            </div>
            <div className="flex items-center gap-2">
              <ExportToDialog context="solvers" projectName="Solver" />
              {cart.size > 0 && (
                <Button className="gradient-primary text-primary-foreground">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {cart.size} in Project
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {/* Search + Domain filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search solvers, equations, methods…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm glass" />
            </div>

            <div className="flex gap-1 p-1 rounded-lg bg-secondary/50">
              {(["all", "physics", "chemistry", "astrophysics"] as const).map((d) => {
                const config = d !== "all" ? domainConfig[d] : null;
                const Icon = config?.icon;
                return (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize flex items-center gap-1.5",
                      domain === d ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {d === "all" ? "All" : config?.label} <span className="text-[10px] opacity-60">({domainCounts[d]})</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 ml-auto">
              {([["rating", "★ Top"], ["downloads", "↓ Popular"], ["name", "A-Z"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key as any)}
                  className={cn("px-2.5 py-1.5 text-[10px] rounded-md transition-colors", sortBy === key ? "bg-background shadow-sm" : "text-muted-foreground")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((solver) => (
                <SolverCard
                  key={solver.id}
                  solver={solver}
                  onSelect={() => setSelectedSolver(solver)}
                  onAdd={() => toggleCart(solver.id)}
                  inCart={cart.has(solver.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No solvers match your search.</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedSolver && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-l border-border bg-muted/30 flex flex-col overflow-hidden"
          >
            <div className="min-w-[420px]">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Solver Details</h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedSolver(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-5 space-y-5">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    {(() => {
                      const cfg = domainConfig[selectedSolver.domain];
                      const Icon = cfg.icon;
                      return (
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", cfg.bg)}>
                          <Icon className={cn("h-6 w-6", cfg.color)} />
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className="font-bold text-lg leading-tight">{selectedSolver.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-[10px] capitalize", domainConfig[selectedSolver.domain].bg)}>
                          {selectedSolver.domain}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{categoryLabels[selectedSolver.category]}</Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{selectedSolver.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="glass rounded-lg p-3 text-center">
                      <div className="text-lg font-bold flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-forge-amber text-forge-amber" /> {selectedSolver.rating}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Rating</div>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <div className="text-lg font-bold">{(selectedSolver.downloads / 1000).toFixed(1)}K</div>
                      <div className="text-[10px] text-muted-foreground">Downloads</div>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <div className={cn("text-lg font-bold font-mono", complexityColors[selectedSolver.complexity])}>{selectedSolver.complexity}</div>
                      <div className="text-[10px] text-muted-foreground">Complexity</div>
                    </div>
                  </div>

                  {/* Key Equations */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Equations</h4>
                    <div className="space-y-1.5">
                      {selectedSolver.equations.map((eq, i) => (
                        <div key={i} className="glass rounded-lg px-3 py-2 font-mono text-xs text-foreground">{eq}</div>
                      ))}
                    </div>
                  </div>

                  {/* Methods */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Methods</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSolver.methods.map((m) => (
                        <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* I/O */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Inputs</h4>
                      <div className="space-y-1">
                        {selectedSolver.inputs.map((inp) => (
                          <div key={inp} className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                            <ArrowRight className="h-2.5 w-2.5 text-forge-cyan" /> {inp}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Outputs</h4>
                      <div className="space-y-1">
                        {selectedSolver.outputs.map((out) => (
                          <div key={out} className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                            <ArrowRight className="h-2.5 w-2.5 text-forge-emerald" /> {out}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Performance & Accuracy</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <Cpu className="h-3.5 w-3.5 text-forge-cyan shrink-0" />
                        <span className="text-muted-foreground">Performance:</span>
                        <span className="font-medium">{selectedSolver.performance}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Shield className="h-3.5 w-3.5 text-forge-emerald shrink-0" />
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className="font-medium">{selectedSolver.accuracy}</span>
                      </div>
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Use Cases</h4>
                    <div className="space-y-1.5">
                      {selectedSolver.useCases.map((uc, i) => (
                        <motion.div
                          key={uc}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-forge-emerald shrink-0" />
                          {uc}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="glass rounded-lg p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-mono">{selectedSolver.version}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Language</span><span>{selectedSolver.language}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">License</span><span>{selectedSolver.license}</span></div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</h4>
                    <div className="flex gap-1.5 flex-wrap">
                      {selectedSolver.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Add to project */}
                  <div className="pt-2 space-y-2">
                    <Button
                      className={cn("w-full", cart.has(selectedSolver.id) ? "bg-forge-emerald hover:bg-forge-emerald/90 text-primary-foreground" : "gradient-primary text-primary-foreground")}
                      onClick={() => toggleCart(selectedSolver.id)}
                    >
                      {cart.has(selectedSolver.id) ? (
                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Added to Project</>
                      ) : (
                        <><Plus className="h-4 w-4 mr-2" /> Add to Project</>
                      )}
                    </Button>
                    <Button variant="outline" className="w-full text-xs" onClick={() => setSelectedSolver(null)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Back to Library
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
