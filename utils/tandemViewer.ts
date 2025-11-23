function getApsToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = process.env.NEXT_PUBLIC_APS_TOKEN;
  return token || null;
}

export class TandemViewer {
  private static _instance: TandemViewer;
  public static get instance(): TandemViewer {
    if (!TandemViewer._instance) {
      TandemViewer._instance = new TandemViewer();
    }
    return TandemViewer._instance;
  }

  public isInitialized: boolean = false;
  public viewer: any;
  public app: any;
  public facility: any;

  constructor() {}

  public reset(): void {
    this.isInitialized = false;
    this.viewer = null;
    this.app = null;
    this.facility = null;
  }

  public async initialize(div: HTMLElement): Promise<void> {
    if (this.isInitialized) return;
    await this.initializeViewer(div);
    this.isInitialized = true;
  }

  private async initializeViewer(div: HTMLElement): Promise<void> {
    const av = (window as any).Autodesk.Viewing;
    const avp = av.Private;
    avp.ENABLE_INLINE_WORKER = false;

    const token = getApsToken();
    if (!token) {
      throw new Error("NEXT_PUBLIC_APS_TOKEN is not set");
    }

    const initOptions = {
      env: "DtProduction",
      api: "dt",
      productId: "Digital Twins",
      useCredentials: true,
      shouldInitializeAuth: false,
      corsWorker: true,
      config3d: {
        // disabledExtensions: { viewcube: true }, // 뷰큐브 비활성화
        extensions: ["Autodesk.ModelEditor"],
        screenModeDelegate: av.NullScreenModeDelegate,
      },
      getAccessToken: (
        onGetAccessToken: (token: string, expire: number) => void
      ) => {
        const tok = getApsToken();
        if (tok) {
          onGetAccessToken(tok, 3600000);
        }
      },
    };

    await new Promise<void>((resolve, reject) => {
      av.Initializer(initOptions, async () => {
        try {
          // 하단 툴바 활성화
          // 비활성화 하고 싶으면, GuiViewer3D 대신 Viewer3D 사용
          this.viewer = new av.GuiViewer3D(div, {
            ...initOptions.config3d,
          });

          await this.viewer.start();

          if (token) {
            av.endpoint.setAccessToken?.(token, 3600000);
            av.endpoint.HTTP_REQUEST_HEADERS[
              "Authorization"
            ] = `Bearer ${token}`;
          }

          this.app = new (window as any).Autodesk.Tandem.DtApp();

          setTimeout(() => {
            const layersBtn = this.viewer
              .getToolbar()
              ?.getControl("toolbar-layers");
            if (layersBtn) {
              layersBtn.setState(1);
            }
          }, 100);

          resolve();
        } catch (err) {
          console.error("뷰어 초기화 중 에러:", err);
          reject(err);
        }
      });
    });
  }

  async fetchFacilities() {
    const teams = await this.app.getTeams();
    const teamFacilitiesPromises = teams.map(async (team: any) => {
      try {
        return await team.getFacilities();
      } catch {
        return [];
      }
    });
    const allTeamFacilities = await Promise.all(teamFacilitiesPromises);
    const allFacilities = allTeamFacilities.flat();
    const uniqueFacilities = new Map<string, any>();
    allFacilities.forEach((f: any) => {
      const urn = typeof f.urn === "function" ? f.urn() : f.twinId || f.urn;
      if (urn && !uniqueFacilities.has(urn)) {
        uniqueFacilities.set(urn, f);
      }
    });
    return Array.from(uniqueFacilities.values());
  }

  async openFacilityByUrn(urn: string) {
    if (!this.viewer || !this.app) {
      throw new Error("Viewer is not initialized");
    }

    const facilities = await this.fetchFacilities();
    const targetFacility = facilities.find((f: any) => {
      const facilityUrn =
        typeof f.urn === "function" ? f.urn() : f.twinId || f.urn;
      return facilityUrn === urn;
    });

    if (!targetFacility) {
      console.error("Facility를 찾을 수 없음. URN:", urn);
      throw new Error(`Facility with URN ${urn} not found`);
    }

    const fac = await this.app.displayFacility(
      targetFacility,
      false,
      this.viewer,
      false
    );
    if (!fac) throw new Error("Failed to display facility");

    this.facility = fac;
    return fac;
  }

  async openFacility(facilityInfo: any) {
    if (!facilityInfo) throw new Error("Facility information is required");
    if (typeof facilityInfo.urn !== "function")
      throw new Error("facilityInfo must be a DtFacility instance");
    if (!this.viewer) throw new Error("Viewer is not initialized");

    const fac = await this.app.displayFacility(
      facilityInfo,
      false,
      this.viewer,
      false
    );
    if (!fac) throw new Error("Failed to display facility");

    this.facility = fac;
    return fac;
  }

  public getFacility() {
    return this.facility;
  }

  public setupViewerOptions(): void {
    if (!this.viewer) return;
    this.viewer.setLightPreset("Plaza");
    this.viewer.setBackgroundColor(0, 30, 80, 255, 255, 255);
    this.viewer.setDisplayEdges(true);
    this.viewer.setGroundShadow(true);
    this.disableLayers();
  }

  public disableLayers(): void {
    if (this.facility?.hud?.layers?.layers) {
      const layers = this.facility.hud.layers.layers;
      layers[0]?.setVisible(false);
      layers[1]?.setVisible(false);
    }
  }
}
