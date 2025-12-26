from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "outline_nodes" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "novel_id" BIGINT NOT NULL /* 所属小说项目ID */,
    "parent_id" INT /* 父节点ID,null表示顶层节点 */,
    "node_type" VARCHAR(20) NOT NULL /* 节点类型: volume\/chapter\/section */,
    "title" VARCHAR(200) NOT NULL /* 节点标题 */,
    "description" TEXT /* 节点描述\/大纲内容 */,
    "position" INT NOT NULL DEFAULT 0 /* 在同级节点中的位置序号 */,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft' /* 节点状态: draft\/editing\/completed\/locked */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 最后更新时间 */,
    "metadata" JSON NOT NULL /* 扩展元数据(JSON格式) */
) /* 大纲节点模型 */;
        ALTER TABLE "chapters" DROP COLUMN "outline";"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "chapters" ADD "outline" TEXT /* 章节大纲 */;
        DROP TABLE IF EXISTS "outline_nodes";"""


MODELS_STATE = (
    "eJztXGtv27gS/SuGP6VAtpH1dnCxQF7d9d02WTTO7mKbwqAkytGNLHklKm2w6H+/HMqSqG"
    "ckN7acxghg2OSMHofD4ZkZMv8OF76F3fDtTYiD4fHg36GHFph+ybUfDoZoucxaoYEgw2WC"
    "EZVgLcgISYBMQhtt5IaYNlk4NANnSRzfA9HbSFNE/TZSRUm7jXRd1UHP8k2q6HjzsoiKxN"
    "FtpGi6AYKR5/wT4Rnx55jcscf99Jk2O56Fv+Iw+bm8n9kOdq3c2zgWXIC1z8jjkrVNPPKO"
    "CcIzGDPTd6OFlwkvH8md76XSjkegdY49HCCC4fIkiOAlvch1V2Ak7x0/aSYSPyKnY2EbRS"
    "5ABdrNSE3OiyitdEzfA8Tpk4XsZedwx5/EkazJuqTKOhVhT5W2aN/iV81wiBUZGpfT4TfW"
    "jwiKJRikGYYw0Ox7CcmzOxRUQ8nrFAClj14ENIFv04hSk5IFqyWqC/R15mJvTu7oT0VogP"
    "CPk49nv558PFCEN3Btn06GeIpcrnpE1gUoZ6jeofAOW7MlCsMvflBhpvXgVqg+D8ZJQwZy"
    "NqGfQlkRkUA/DVNlKGOKu6rLSYumC6N1cB+JegvgqVQt8qwvDz1eIMftAniq0LcpjwUEwB"
    "rGemAKbayYStWDKZTs2HPM+67egddZC9IVYM9iuKoqKRTTsS3shmMIfLcTmIn89lwA8+7D"
    "Kiz1sSXST1ET18FSbIOlWI+lWMLSCWeUmDgPFYCe+hQ35NUwAV6vAKxBFTeFbOoISjYq2u"
    "BWRepKVdukjla1JKMdxg2Ynl5dvYeLLMLwH5c1TKYFcG8+nF5Qn8Awp0IOwTxpyJBGD5Q+"
    "BF3sNtPo3QUoYwlWKsG0bz6+X8tyFaWN6SpKve1CXx5SM8Dw+jNEyrCe0x7iLHA1tHnNAr"
    "zWSvVt8mX7TGFk0E8qR81YsalJjxVbbgk7fTPrynMfVxbQgPp08uHienry4fechZ+fTC+g"
    "hzmoxWOh9UAtDFB6kcGfk+mvA/g5+Pvq8oLh6odkHrA7ZnLTv4fwTCgi/szzv8yQxS3wSW"
    "sCV264o6W15nDnNXdtuFXVlmGgDeEVDzd7eIhS7XsuxoIGA5n3X1BgzXI9mVmEmBAKUVix"
    "gq003/32EbuIAV4efi6cv46vtPXpPtIkygkEReZDsU5rV9bKQ+mLfh2W5a6FuCi2IA/N2b"
    "vAveFOFVjVZEY4KJsTJDN++DonSgwD2L6t4lZJE178yQTKp5TE3ePH4ecfN5+SobIr+RQA"
    "vANPWon3H+Hz9jVWRLwzIegDcqMKhj/FX2sMM1XYLVAVQTK/m9NPL/6a5pbABLqDDyd/vc"
    "ktg++vLn9JxDmoz95fne6p6OvhJnsq+qqGe/Xw+fz+rNPCzmk8vbrvMr98jqW+xOrzyJZh"
    "fecH2Jl7v+FHhu6EPhHyzKr1qFCLeymo1rF22hygLymr5M2IvjR9VRxnl85Ors9Ozi+G3+"
    "rjo03yf0rFlqS6Kpp0NfJ+MxZqT/kRFiBpqotF3l4k+7WCr6dCmjT2zuJXo1zpOOvJfF6r"
    "73JSZlA3N62joxyfl9QWdF4qrm0Zm4euAtVcIeRFC6PKe9baZlmx/7WJn7EK1iGHL9lbXJ"
    "t4YIlDuhWWUoX+o6Sc59MFjRI3fVzKh7SrMbUrMjVVmUoBKL0jwV4FWa4PQTmV3ssfqqFK"
    "QIh12CAx0hUo2hvjfSS6j0T3keimIlFNEJJ9MrKNIWOrSONXPPSlqHQZ+P/DJukWmOaV+l"
    "//VVGGYTYVSJnq2hg2ReGtJqI71Jw2GVNd+g/Y/T0enWFFYJXrP2yKrjyQnK0GunWMpZiC"
    "DclWyP9kA/FEvNVOaR97bT32eslUNmdIu0dl+eftQGcLar1T2hzKkgnT2G67wW/blJbCEn"
    "Sy5lShd5h5D6mZmlHtSvvZRxmSx25OIlXoH9bReAy8UDHBkk3mKdqWBjcPKyJRxW6UJlwT"
    "jS1uUbUCZLOlsdE1aKIBOyqF9TanP/9+1X10+wOHOK8out3XWSsi2heeJeTX+l3PEsKxKA"
    "pjVIV2bYCVV9pe8kCoRNtQ4BykotEppGGLIY/arlLPXDnIilYV6/5/r68un6p1VS3+Nx59"
    "10+WY5LDgeuE5PPGqMCnz5U8IKspTM7ZClVzNLWzRQMizRZdNN6Cq4ELFC06CvEsATR8DA"
    "lelIei8UhL9QW2eLalNjfDH26hn3ay4YAv+mimbcQT4buH5xkPvdTunDl15i9k8wxHzNY+"
    "eTwWRUnSREFSdUXWNEUXUo9T7mpyPaeTXwDk3GDsVBrzKiKu4+FL+mtYkcXkuw+bkph+LE"
    "iZAh2R1jnMsajBHDDEdFYIxvipHOaTSrce/aMrDUw8VRJoq4wFiJAwgnqgKYvJdzr9oE6o"
    "6fLxrffT4A8waXwANW1Ne3M8YKGVmqhwN6Oyq40zB/ysZiqgmx0VVoSi4jU2AYGDlH8kij"
    "nvUKm+T872kpyNE/RdvSKv1b9b5Os21VWA3XORueIZCmjY0LF2xuusNQTPGW1ooqTyk3ly"
    "fgiiMUWD49oSqvM3/ZBkcOUxXiXIGw7C80r91yb4BSJL5x4PHpinP1rRx6Mw9sm7kTJ7yb"
    "Wg3IK8rwVtyJXkUE5rQUd5brTrGQ0aHzrVA1Hv0DmVvrMZGoQWiiyYCZfkB0XGopWQONmW"
    "rfQ8VM87Jl98qSPnz9NSx/GAaRxhy4GjqUemv1jC1nvryPXNe7zW/0fal0L2pZB9KaQqku"
    "A2+u3LIsOKssgCEwTBZJfUMq/TW175P3bkMSI8MCLHpa40fAu3/bnSFauiOmYRJbCMkSwl"
    "uX1VUvEBvGhc46edtmC/2Z0c9I4k3k5w4Jh3w4qc26rnsCndhjKZp/Js9WmUfSpp66mkBx"
    "yElZy3noFxKj3Hd+1R3Py/koKp0QHElfjLBHAj/2KitnbfUP6srd1vbYn6Plh/+OXl2/8B"
    "4cwfxg=="
)
