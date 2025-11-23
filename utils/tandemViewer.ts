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
    if (!this.app) {
      throw new Error("App is not initialized");
    }

    const allFacilities: any[] = [];

    // 1. 공유받은 facility 조회 (getCurrentTeamsFacilities)
    try {
      const facilitiesSharedWithMe = await this.app.getCurrentTeamsFacilities();
      if (facilitiesSharedWithMe) {
        const sharedArray = Array.from(facilitiesSharedWithMe);
        allFacilities.push(...sharedArray);
      }
    } catch (error) {
      console.warn("공유받은 facility 조회 실패:", error);
    }

    // 2. 사용자가 직접 만든 facility 조회 (getUsersFacilities)
    try {
      const myFacilities = await this.app.getUsersFacilities();
      if (myFacilities) {
        const myArray = Array.from(myFacilities);
        allFacilities.push(...myArray);
      }
    } catch (error) {
      console.warn("사용자 facility 조회 실패:", error);
    }

    // 3. 사용자가 멤버인 모든 팀의 facility 조회
    try {
      const teams = await this.app.getTeams();
      if (teams && teams.length > 0) {
        const teamFacilitiesPromises = teams.map(async (team: any) => {
          try {
            const facilities = await team.getFacilities();
            return facilities ? Array.from(facilities) : [];
          } catch (error) {
            console.warn("팀 facility 조회 실패:", error);
            return [];
          }
        });

        const allTeamFacilities = await Promise.all(teamFacilitiesPromises);
        allFacilities.push(...allTeamFacilities.flat());
      }
    } catch (error) {
      console.warn("팀 facility 조회 실패:", error);
    }

    // 4. 모든 facility를 URN 기준으로 중복 제거
    const uniqueFacilities = new Map<string, any>();
    allFacilities.forEach((f: any) => {
      if (!f) return;
      const urn = typeof f.urn === "function" ? f.urn() : f.twinId || f.urn;
      if (urn && !uniqueFacilities.has(urn)) {
        uniqueFacilities.set(urn, f);
      }
    });

    const result = Array.from(uniqueFacilities.values());
    console.log(`총 ${result.length}개의 Facility 발견`);
    return result;
  }

  async openFacilityByUrn(urn: string) {
    if (!this.viewer || !this.app) {
      throw new Error("Viewer is not initialized");
    }

    if (!urn || typeof urn !== "string") {
      throw new Error("Invalid URN provided");
    }

    const facilities = await this.fetchFacilities();

    if (!facilities || facilities.length === 0) {
      throw new Error("사용자가 접근 가능한 Facility가 없습니다");
    }

    const targetFacility = facilities.find((f: any) => {
      if (!f) return false;
      const facilityUrn =
        typeof f.urn === "function" ? f.urn() : f.twinId || f.urn;
      return facilityUrn === urn;
    });

    if (!targetFacility) {
      const availableUrns = facilities.map((f: any) => {
        const facilityUrn =
          typeof f.urn === "function" ? f.urn() : f.twinId || f.urn;
        return facilityUrn;
      });
      console.error("Facility를 찾을 수 없음. URN:", urn);
      console.error("사용 가능한 Facility URNs:", availableUrns);
      throw new Error(`Facility with URN ${urn} not found`);
    }

    if (!this.viewer || !this.app) {
      throw new Error(
        "Viewer or App is not initialized before displayFacility"
      );
    }

    const fac = await this.app.displayFacility(
      targetFacility,
      false,
      this.viewer,
      false
    );

    if (!fac) {
      throw new Error(
        "Failed to display facility: displayFacility returned null"
      );
    }

    this.facility = fac;
    return fac;
  }

  public setupViewerOptions(): void {
    if (!this.viewer) return;
    this.viewer.setLightPreset("Harbor");
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
