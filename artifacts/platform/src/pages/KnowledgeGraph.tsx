import { useGetKnowledgeGraph, KnowledgeGraphNode, KnowledgeGraphEdge } from "@workspace/api-client-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// A simple physics-based force layout engine since we can't easily install d3
class ForceSimulation {
  nodes: (KnowledgeGraphNode & { x: number; y: number; vx: number; vy: number })[];
  edges: KnowledgeGraphEdge[];
  width: number;
  height: number;
  
  constructor(nodes: KnowledgeGraphNode[], edges: KnowledgeGraphEdge[], width: number, height: number) {
    this.width = width;
    this.height = height;
    
    // Initialize nodes with random positions near center
    this.nodes = nodes.map(n => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0
    }));
    this.edges = edges;
  }

  tick() {
    const k = 0.5; // Cooling factor
    const repulse = 2000; // Repulsion strength
    const spring = 0.05; // Spring constant
    const springLength = 100;
    
    // Apply repulsion between all nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n1 = this.nodes[i];
        const n2 = this.nodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) dist = 0.01;
        
        const force = repulse / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        n1.vx += fx;
        n1.vy += fy;
        n2.vx -= fx;
        n2.vy -= fy;
      }
    }

    // Apply attraction for edges
    for (const edge of this.edges) {
      const source = this.nodes.find(n => n.id === edge.source);
      const target = this.nodes.find(n => n.id === edge.target);
      if (!source || !target) continue;
      
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) dist = 0.01;
      
      const force = (dist - springLength) * spring;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    // Apply gravity to center
    for (const node of this.nodes) {
      node.vx += (this.width / 2 - node.x) * 0.01;
      node.vy += (this.height / 2 - node.y) * 0.01;
    }

    // Update positions with friction
    for (const node of this.nodes) {
      node.vx *= 0.8;
      node.vy *= 0.8;
      node.x += node.vx * k;
      node.y += node.vy * k;
      
      // Bounds
      node.x = Math.max(20, Math.min(this.width - 20, node.x));
      node.y = Math.max(20, Math.min(this.height - 20, node.y));
    }
    
    return this.nodes;
  }
}

const colors = {
  user: "hsl(215, 100%, 65%)",
  profile: "hsl(280, 100%, 70%)",
  dataSource: "hsl(140, 70%, 50%)",
  scrapeJob: "hsl(35, 100%, 55%)",
  featureSet: "hsl(10, 90%, 60%)",
  trainingRun: "hsl(330, 90%, 65%)",
  testRun: "hsl(180, 60%, 50%)",
};

export default function KnowledgeGraph() {
  const { data: graph, isLoading } = useGetKnowledgeGraph();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode | null>(null);
  const simRef = useRef<ForceSimulation | null>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!graph || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 600 * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `600px`;

    simRef.current = new ForceSimulation(graph.nodes, graph.edges, rect.width, 600);

    let hoverNodeId: string | null = null;
    let dragNode: any = null;

    const render = () => {
      if (!simRef.current) return;
      const nodes = simRef.current.tick();
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw edges
      ctx.lineWidth = 1;
      for (const edge of graph.edges) {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) continue;
        
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = "rgba(150, 150, 150, 0.2)";
        ctx.stroke();

        // Edge label (optional, can be noisy)
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.fillStyle = "rgba(150, 150, 150, 0.6)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // ctx.fillText(edge.relation, midX, midY);
      }
      
      // Draw nodes
      for (const node of nodes) {
        const isHovered = node.id === hoverNodeId;
        const isSelected = node.id === selectedNode?.id;
        const r = isHovered || isSelected ? 12 : 8;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = colors[node.entityType as keyof typeof colors] || "gray";
        ctx.fill();
        
        if (isSelected) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = "white";
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.stroke();
        }

        ctx.fillStyle = isHovered ? "white" : "rgba(200, 200, 200, 0.8)";
        ctx.font = isHovered ? "bold 12px sans-serif" : "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + r + 12);
      }

      frameRef.current = requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (dragNode) {
        dragNode.x = x;
        dragNode.y = y;
        dragNode.vx = 0;
        dragNode.vy = 0;
        return;
      }

      let found = null;
      for (const node of simRef.current!.nodes) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (dx * dx + dy * dy < 200) {
          found = node.id;
          break;
        }
      }
      if (hoverNodeId !== found) {
        hoverNodeId = found;
        canvas.style.cursor = found ? "pointer" : "default";
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (hoverNodeId) {
        dragNode = simRef.current!.nodes.find(n => n.id === hoverNodeId);
      }
    };

    const handleMouseUp = () => {
      dragNode = null;
    };

    const handleClick = (e: MouseEvent) => {
      if (!dragNode && hoverNodeId) {
        const node = graph.nodes.find(n => n.id === hoverNodeId);
        if (node) setSelectedNode(node);
      } else if (!hoverNodeId) {
        setSelectedNode(null);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
    };
  }, [graph, selectedNode]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
        <p className="text-muted-foreground mt-2">
          Live relational mapping of system entities and state.
        </p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <Card className="flex-1 overflow-hidden relative border-border/50 bg-black/20">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 p-3 bg-card/80 backdrop-blur rounded-md border text-xs">
            <span className="font-semibold mb-1">Legend</span>
            {Object.entries(colors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
          <canvas ref={canvasRef} className="w-full h-full cursor-default outline-none" />
        </Card>

        {selectedNode && (
          <Card className="w-80 shrink-0 overflow-y-auto animate-in slide-in-from-right-4 border-primary/20">
            <CardHeader className="bg-muted/20 pb-4 border-b">
              <Badge 
                style={{ backgroundColor: colors[selectedNode.entityType as keyof typeof colors] }} 
                className="w-fit text-white mb-2"
              >
                {selectedNode.entityType}
              </Badge>
              <CardTitle className="text-xl break-words">{selectedNode.label}</CardTitle>
              <CardDescription className="font-mono text-xs">ID: {selectedNode.id}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {selectedNode.detail && Object.keys(selectedNode.detail).length > 0 ? (
                  Object.entries(selectedNode.detail).map(([key, value]) => (
                    <div key={key}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{key}</h4>
                      <div className="text-sm bg-muted/30 p-2 rounded border font-mono whitespace-pre-wrap break-all">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No details available.</p>
                )}

                {/* Show connected edges */}
                {graph && (
                  <div className="pt-4 border-t mt-6">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Connections</h4>
                    <div className="space-y-2">
                      {graph.edges.filter(e => e.source === selectedNode.id).map(edge => {
                        const target = graph.nodes.find(n => n.id === edge.target);
                        return (
                          <div key={edge.target} className="text-xs flex items-center gap-2">
                            <span className="text-muted-foreground">{edge.relation}</span>
                            <span>→</span>
                            <span className="font-medium truncate">{target?.label || edge.target}</span>
                          </div>
                        );
                      })}
                      {graph.edges.filter(e => e.target === selectedNode.id).map(edge => {
                        const source = graph.nodes.find(n => n.id === edge.source);
                        return (
                          <div key={edge.source} className="text-xs flex items-center gap-2">
                            <span className="text-muted-foreground">←</span>
                            <span className="text-muted-foreground">{edge.relation}</span>
                            <span className="font-medium truncate">{source?.label || edge.source}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
